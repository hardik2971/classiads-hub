import { Router } from "express";
import { me, optionalAuth, requireAuth } from "../lib/auth";
import { fail, filled, forbidden, h, intParam, intQ, ms, notFound, ok, okPage, randomStr, slugify, strQ, toMinor } from "../lib/http";
import { assertImage, storeFile } from "../lib/media";
import { fileFor, filesFor, multipart } from "../lib/multipart";
import { notify } from "../lib/notify";
import { jobAppRes, jobRes, verificationRes } from "../lib/resources";
import { C, Doc, col, docs, first, get, getMany, getOrFail, inc, insert, lookup, ref, update } from "../lib/store";
import { fieldError, validate } from "../lib/validate";

export const jobsRouter = Router();

const isOpen = (j: Doc) => j.status === "open" && (!j.expires_at || ms(j.expires_at) > Date.now());

async function jobRelations(list: Doc[]) {
  const [cities, categories, users] = await Promise.all([lookup(C.cities), lookup(C.categories), getMany(C.users, list.map((j) => j.user_id))]);
  return { cities, categories, users };
}

const JOB_RULES = {
  title: "required|string|max:191",
  description: "required|string|min:10",
  company_name: "nullable|string|max:191",
  category_id: "nullable|integer",
  city_id: "nullable|integer",
  employment_type: "nullable|in:full_time,part_time,contract,internship,remote",
  salary_min: "nullable|numeric|min:0",
  salary_max: "nullable|numeric|min:0",
  currency_code: "nullable|string|size:3",
  status: "nullable|in:draft,open,closed",
  expires_at: "nullable|date",
};

function jobData(d: Record<string, any>) {
  const out: Record<string, any> = { ...d };
  for (const k of ["salary_min", "salary_max"]) if (k in out) out[k] = toMinor(out[k]);
  if (out.expires_at) out.expires_at = new Date(out.expires_at);
  return out;
}

jobsRouter.get(
  "/jobs",
  h(async (req, res) => {
    let list = docs(await col(C.jobListings).where("status", "==", "open").get()).filter(isOpen);
    if (filled(req, "q")) list = list.filter((j) => String(j.title).toLowerCase().includes(strQ(req, "q").toLowerCase()));
    if (filled(req, "employment_type")) list = list.filter((j) => j.employment_type === strQ(req, "employment_type"));
    if (filled(req, "city_id")) list = list.filter((j) => Number(j.city_id) === intQ(req, "city_id"));
    list.sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const rel = await jobRelations(list);
    okPage(res, req, list.map((j) => jobRes(j, rel)), "Jobs.");
  }),
);

jobsRouter.get(
  "/my/jobs",
  requireAuth,
  h(async (req, res) => {
    const list = docs(await col(C.jobListings).where("user_id", "==", me(req).id).get()).sort((a, b) => ms(b.created_at) - ms(a.created_at));
    okPage(res, req, list.map((j) => jobRes(j)), "My jobs.");
  }),
);

jobsRouter.get(
  "/my/applications",
  requireAuth,
  h(async (req, res) => {
    const apps = docs(await col(C.jobApplications).where("user_id", "==", me(req).id).get()).sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const jobs = await getMany(C.jobListings, apps.map((a) => a.job_listing_id));
    okPage(res, req, apps.map((a) => jobAppRes(a, { job: jobs.get(Number(a.job_listing_id)) ? jobRes(jobs.get(Number(a.job_listing_id))!) : null })), "My applications.");
  }),
);

jobsRouter.get(
  "/jobs/:slug",
  optionalAuth,
  h(async (req, res) => {
    const job = (await first(C.jobListings, "slug", req.params.slug)) ?? (/^\d+$/.test(req.params.slug) ? await get(C.jobListings, req.params.slug) : null);
    if (!job) throw notFound("Job");
    const rel = await jobRelations([job]);
    const hasApplied = req.user ? !(await col(C.jobApplications).where("job_listing_id", "==", job.id).where("user_id", "==", req.user.id).limit(1).get()).empty : undefined;
    ok(res, jobRes(job, { ...rel, hasApplied }), "Job.");
  }),
);

jobsRouter.post(
  "/jobs",
  requireAuth,
  h(async (req, res) => {
    const d = jobData(validate(req.body, JOB_RULES));
    let slug = slugify(d.title, 80);
    if (await first(C.jobListings, "slug", slug)) slug = `${slug}-${randomStr(6)}`;
    const job = await insert(C.jobListings, { ...d, slug, user_id: me(req).id, status: d.status ?? "open", applications_count: 0 });
    ok(res, jobRes(job), "Job posted.", 201);
  }),
);

jobsRouter.put(
  "/jobs/:id(\\d+)",
  requireAuth,
  h(async (req, res) => {
    const job = await getOrFail(C.jobListings, intParam(req, "id"), "Job");
    if (Number(job.user_id) !== me(req).id) throw forbidden();
    const rules = Object.fromEntries(Object.entries(JOB_RULES).map(([k, v]) => [k, `sometimes|${v.replace("required|", "")}`]));
    const d = jobData(validate(req.body, rules));
    await update(C.jobListings, job.id, d);
    ok(res, jobRes({ ...job, ...d }), "Job updated.");
  }),
);

jobsRouter.delete(
  "/jobs/:id(\\d+)",
  requireAuth,
  h(async (req, res) => {
    const job = await getOrFail(C.jobListings, intParam(req, "id"), "Job");
    if (Number(job.user_id) !== me(req).id) throw forbidden();
    await ref(C.jobListings, job.id).delete();
    ok(res, null, "Job deleted.");
  }),
);

jobsRouter.get(
  "/jobs/:id(\\d+)/applications",
  requireAuth,
  h(async (req, res) => {
    const job = await getOrFail(C.jobListings, intParam(req, "id"), "Job");
    if (Number(job.user_id) !== me(req).id) throw forbidden();
    const apps = docs(await col(C.jobApplications).where("job_listing_id", "==", job.id).get()).sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const users = await getMany(C.users, apps.map((a) => a.user_id));
    okPage(res, req, apps.map((a) => jobAppRes(a, { applicant: users.get(Number(a.user_id)) ?? null })), "Applications.");
  }),
);

jobsRouter.post(
  "/jobs/:id(\\d+)/applications/:appId(\\d+)/status",
  requireAuth,
  h(async (req, res) => {
    const job = await getOrFail(C.jobListings, intParam(req, "id"), "Job");
    if (Number(job.user_id) !== me(req).id) throw forbidden();
    const d = validate(req.body, { status: "required|in:submitted,reviewed,shortlisted,rejected,hired" });
    const app = await get(C.jobApplications, intParam(req, "appId"));
    if (!app || Number(app.job_listing_id) !== job.id) throw notFound("Application");
    await update(C.jobApplications, app.id, { status: d.status });
    await notify(Number(app.user_id), "job.application_status", "Application update", `Your application for "${job.title}" is now ${d.status}.`, { job_id: job.id, application_id: app.id });
    ok(res, jobAppRes({ ...app, status: d.status }), "Application updated.");
  }),
);

jobsRouter.post(
  "/jobs/:id(\\d+)/apply",
  multipart,
  requireAuth,
  h(async (req, res) => {
    const job = await get(C.jobListings, intParam(req, "id"));
    if (!job || !isOpen(job)) throw notFound("Job");
    const user = me(req);
    if (Number(job.user_id) === user.id) return fail(res, "You cannot apply to your own job listing.", 422);
    if (!(await col(C.jobApplications).where("job_listing_id", "==", job.id).where("user_id", "==", user.id).limit(1).get()).empty) {
      return fail(res, "You have already applied to this job.", 422);
    }
    const d = validate(req.body, { cover_letter: "nullable|string|max:5000", resume_path: "nullable|string|max:255" });
    const resume = fileFor(req, "resume");
    if (resume) d.resume_path = await storeFile(resume, `resumes/${user.id}`);
    const app = await insert(C.jobApplications, { job_listing_id: job.id, user_id: user.id, cover_letter: d.cover_letter ?? null, resume_path: d.resume_path ?? null, status: "submitted" });
    await ref(C.jobListings, job.id).update({ applications_count: inc() });
    await notify(Number(job.user_id), "job.application", "New job application", `${user.name} applied to "${job.title}".`, { job_id: job.id, application_id: app.id });
    ok(res, jobAppRes(app), "Application submitted.", 201);
  }),
);

// ---------- seller verification (KYC) ----------

jobsRouter.get(
  "/verification",
  requireAuth,
  h(async (req, res) => {
    const list = docs(await col(C.verificationRequests).where("user_id", "==", me(req).id).get()).sort((a, b) => ms(b.created_at) - ms(a.created_at));
    ok(res, { is_verified: !!me(req).is_verified, request: list[0] ? verificationRes(list[0]) : null }, "Verification status.");
  }),
);

jobsRouter.post(
  "/verification",
  multipart,
  requireAuth,
  h(async (req, res) => {
    const user = me(req);
    if (user.is_verified) return fail(res, "Your account is already verified.", 422);
    const pending = docs(await col(C.verificationRequests).where("user_id", "==", user.id).get()).find((v) => v.status === "pending");
    if (pending) return fail(res, "You already have a pending verification request.", 422);

    const d = validate(req.body, { document_type: "required|in:id_card,passport,driving_license,other", document_number: "nullable|string|max:100" });
    const front = fileFor(req, "front_image");
    if (!front) throw fieldError("front_image", "The front image field is required.");
    const paths: Record<string, string | null> = { front_image_path: null, back_image_path: null, selfie_image_path: null };
    for (const [field, key] of [
      ["front_image", "front_image_path"],
      ["back_image", "back_image_path"],
      ["selfie_image", "selfie_image_path"],
    ] as const) {
      const f = fileFor(req, field);
      if (!f) continue;
      try {
        assertImage(f, field);
      } catch (e: any) {
        throw fieldError(field, e.message);
      }
      paths[key] = await storeFile(f, `kyc/${user.id}`);
    }

    // Optional admin-defined verification fields (`field_<id>`: text in body, files as uploads).
    const defs = (await col(C.verificationFields).get()).docs.map((x) => ({ ...x.data(), id: Number(x.id) }) as Doc).filter((x) => x.is_active !== false);
    const fields: Record<string, unknown> = {};
    for (const f of defs) {
      const key = `field_${f.id}`;
      const file = filesFor(req, key)[0];
      if (file) fields[f.name] = await storeFile(file, `kyc/${user.id}`);
      else if (req.body?.[key] !== undefined && req.body[key] !== "") {
        const v = String(req.body[key]);
        if ((f.min_length && v.length < Number(f.min_length)) || (f.max_length && v.length > Number(f.max_length))) {
          throw fieldError(key, `The ${f.name} must be between ${f.min_length ?? 0} and ${f.max_length ?? "∞"} characters.`);
        }
        fields[f.name] = v;
      }
    }

    const row = await insert(C.verificationRequests, { user_id: user.id, document_type: d.document_type, document_number: d.document_number ?? null, ...paths, fields, status: "pending", rejection_reason: null, reviewed_at: null });
    ok(res, verificationRes(row), "Verification submitted for review.", 201);
  }),
);
