const UA = { "User-Agent": "ClassiAdsHub-demo/1.0 (dhaval@bydesign.io)" };
(async () => {
  for (const q of process.argv.slice(2)) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=30&gsrsearch=${encodeURIComponent(q + " filetype:bitmap")}&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=1200`;
    const j = await (await fetch(url, { headers: UA })).json();
    console.log("==", q);
    for (const p of Object.values(j.query?.pages ?? {})) {
      const i = p.imageinfo?.[0]; if (!i || i.width < 1200 || i.width < i.height) continue;
      const lic = i.extmetadata?.LicenseShortName?.value ?? "";
      if (!/cc0|public domain|cc by/i.test(lic)) continue;
      console.log(lic.padEnd(14), p.title.slice(0, 90));
    }
  }
})();
