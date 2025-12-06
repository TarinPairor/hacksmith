const { users } = require('./users');

// Orders (for PandaBuy/Dell style scraping)
const orders = [];
for (let i = 1; i <= 1000; i++) {
  orders.push({
    id: String(i),
    order_number: `ORD${String(i).padStart(6, '0')}`,
    customer_id: String((i % 4) + 1),
    customer_name: users[(i % 4)].username,
    customer_email: users[(i % 4)].email,
    customer_address: users[(i % 4)].address,
    customer_phone: users[(i % 4)].phone,
    items: [
      { name: `Product ${i}`, quantity: 1, price: 99.99 }
    ],
    total: 99.99,
    status: i % 3 === 0 ? "shipped" : i % 3 === 1 ? "pending" : "processing",
    created_at: new Date(2024, 0, 1 + (i % 30)).toISOString()
  });
}

module.exports = {
  orders,
  findOrderById: (id) => orders.find(o => o.id === id),
  findOrderByNumber: (number) => orders.find(o => o.order_number === number)
};

