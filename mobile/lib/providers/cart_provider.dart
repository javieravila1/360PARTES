import 'package:flutter_riverpod/flutter_riverpod.dart';

class CartItem {
  final Map<String, dynamic> product;
  final Map<String, dynamic>? batch;
  int quantity;
  double? customPrice;

  CartItem({required this.product, this.batch, this.quantity = 1, this.customPrice});

  String get cartKey => '${product['id']}-${batch?['id'] ?? ''}';
  double get unitPrice => customPrice ?? (double.tryParse(product['selling_price']?.toString() ?? '0') ?? 0.0);
  double get total => unitPrice * quantity;
}

class CartNotifier extends StateNotifier<List<CartItem>> {
  CartNotifier() : super([]);

  void addProduct(Map<String, dynamic> product, {Map<String, dynamic>? batch}) {
    final key = '${product['id']}-${batch?['id'] ?? ''}';
    final index = state.indexWhere((item) => item.cartKey == key);
    if (index >= 0) {
      final newState = [...state];
      newState[index].quantity++;
      state = newState;
    } else {
      state = [...state, CartItem(product: product, batch: batch)];
    }
  }

  void addProductWithPrice(Map<String, dynamic> product, double finalPrice, {Map<String, dynamic>? batch}) {
    final key = '${product['id']}-${batch?['id'] ?? ''}';
    final index = state.indexWhere((item) => item.cartKey == key && item.customPrice == finalPrice);
    if (index >= 0) {
      final newState = [...state];
      newState[index].quantity++;
      state = newState;
    } else {
      state = [...state, CartItem(product: product, batch: batch, quantity: 1, customPrice: finalPrice)];
    }
  }

  void removeProduct(String cartKey) {
    state = state.where((item) => item.cartKey != cartKey).toList();
  }

  void updateQuantity(String cartKey, int newQuantity) {
    if (newQuantity <= 0) {
      removeProduct(cartKey);
      return;
    }
    final newState = [...state];
    final index = newState.indexWhere((item) => item.cartKey == cartKey);
    if (index >= 0) {
      newState[index].quantity = newQuantity;
      state = newState;
    }
  }

  void updateCustomPrice(String cartKey, double price) {
    final newState = [...state];
    final index = newState.indexWhere((item) => item.cartKey == cartKey);
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
