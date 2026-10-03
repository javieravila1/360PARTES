import 'package:flutter_riverpod/flutter_riverpod.dart';

class CartItem {
  final Map<String, dynamic> product;
  int quantity;
  double? customPrice;

  CartItem({required this.product, this.quantity = 1, this.customPrice});

  double get unitPrice => customPrice ?? (double.tryParse(product['selling_price']?.toString() ?? '0') ?? 0.0);
  double get total => unitPrice * quantity;
}

class CartNotifier extends StateNotifier<List<CartItem>> {
  CartNotifier() : super([]);

  void addProduct(Map<String, dynamic> product) {
    final index = state.indexWhere((item) => item.product['id'] == product['id']);
    if (index >= 0) {
      final newState = [...state];
      newState[index].quantity++;
      state = newState;
    } else {
      state = [...state, CartItem(product: product)];
    }
  }

  void addProductWithPrice(Map<String, dynamic> product, double finalPrice) {
    state = [...state, CartItem(product: product, quantity: 1, customPrice: finalPrice)];
  }

  void removeProduct(String productId) {
    state = state.where((item) => item.product['id'] != productId).toList();
  }

  void updateQuantity(String productId, int newQuantity) {
    if (newQuantity <= 0) {
      removeProduct(productId);
      return;
    }
    final newState = [...state];
    final index = newState.indexWhere((item) => item.product['id'] == productId);
    if (index >= 0) {
      newState[index].quantity = newQuantity;
      state = newState;
    }
  }

  void updateCustomPrice(String productId, double price) {
    final newState = [...state];
    final index = newState.indexWhere((item) => item.product['id'] == productId);
    if (index >= 0) {
      newState[index].customPrice = price;
      state = newState;
    }
  }

  void clear() {
    state = [];
  }

  double get total => state.fold(0, (sum, item) => sum + item.total);
  int get itemCount => state.fold(0, (sum, item) => sum + item.quantity);
}

final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>((ref) {
  return CartNotifier();
});
