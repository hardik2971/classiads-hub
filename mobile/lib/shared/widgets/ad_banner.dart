import 'package:flutter/material.dart';

/// AdMob banner placement (#40). Stand-in for the real `google_mobile_ads`
/// BannerAd — swap the body for a `BannerAd` widget once the AdMob app ID + ad
/// unit IDs are configured (the SDK isn't web-compatible, so this keeps the app
/// building everywhere meanwhile). Until then it renders nothing, so release
/// builds never show a fake "Sponsored" slot.
class AdBannerPlaceholder extends StatelessWidget {
  const AdBannerPlaceholder({super.key});

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}
