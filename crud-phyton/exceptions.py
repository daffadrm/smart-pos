class NotFoundError(Exception):
    pass


class ValidationError(Exception):
    pass


class InsufficientStockError(Exception):
    def __init__(self, product_name: str, available: int, requested: int):
        self.product_name = product_name
        self.available = available
        self.requested = requested
        super().__init__(
            f"Stok {product_name} tidak mencukupi (tersedia {available}, dibutuhkan {requested})"
        )


class InsufficientPaymentError(Exception):
    def __init__(self, total: float, paid: float):
        self.total = total
        self.paid = paid
        super().__init__(f"Pembayaran kurang (total {total}, dibayar {paid})")
