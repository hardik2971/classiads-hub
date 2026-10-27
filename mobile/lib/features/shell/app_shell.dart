import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';

/// Bottom-nav shell: Home · Chat · (+) · My Ads · Profile.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.navigationShell});
  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/post-ad'),
        shape: const CircleBorder(),
        backgroundColor: AppTheme.seed,        // navy #272757
        foregroundColor: Colors.white,
        elevation: 4,
        child: const Icon(Icons.add, size: 28),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        height: 64,
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _item(context, Icons.home_outlined, Icons.home, 'Home', 0),
            _item(context, Icons.chat_bubble_outline, Icons.chat_bubble, 'Chat', 1),
            const SizedBox(width: 48),
            _item(context, Icons.inventory_2_outlined, Icons.inventory_2, 'My Ads', 2),
            _item(context, Icons.person_outline, Icons.person, 'Profile', 3),
          ],
        ),
      ),
    );
  }

  Widget _item(BuildContext context, IconData icon, IconData active, String label, int index) {
    final selected = navigationShell.currentIndex == index;
    final color = selected ? Theme.of(context).colorScheme.primary : Colors.black54;
    return Expanded(
      child: InkWell(
        onTap: () => navigationShell.goBranch(index, initialLocation: index == navigationShell.currentIndex),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(selected ? active : icon, color: color, size: 22),
            Text(label, style: TextStyle(color: color, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}
