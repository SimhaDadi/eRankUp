import 'package:flutter/material.dart';
import '../services/haptic_service.dart';

/// A premium card wrapper that provides 
/// micro-interactions (scaling) and haptic feedback.
class PremiumCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final Color? color;
  final double scaleAmount;
  final BorderRadius? borderRadius;
  final List<BoxShadow>? boxShadow;
  final Border? border;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  const PremiumCard({
    super.key,
    required this.child,
    this.onTap,
    this.color,
    this.scaleAmount = 0.98,
    this.borderRadius,
    this.boxShadow,
    this.border,
    this.padding,
    this.margin,
  });

  @override
  State<PremiumCard> createState() => _PremiumCardState();
}

class _PremiumCardState extends State<PremiumCard> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: widget.scaleAmount).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    if (widget.onTap != null) {
      _controller.forward();
      HapticService.light();
    }
  }

  void _handleTapUp(TapUpDetails details) {
    if (widget.onTap != null) {
      _controller.reverse();
      widget.onTap!();
    }
  }

  void _handleTapCancel() {
    if (widget.onTap != null) {
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          margin: widget.margin,
          padding: widget.padding,
          decoration: BoxDecoration(
            color: widget.color ?? theme.cardTheme.color ?? Colors.white,
            borderRadius: widget.borderRadius ?? BorderRadius.circular(16),
            border: widget.border ?? (theme.brightness == Brightness.dark 
              ? Border.all(color: const Color(0xFF334155)) 
              : null),
            boxShadow: widget.boxShadow,
          ),
          child: widget.child,
        ),
      ),
    );
  }
}
