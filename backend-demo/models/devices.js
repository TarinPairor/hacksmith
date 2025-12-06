const { users } = require('./users');

// Devices (for Dell service tag enumeration)
const devices = [];
const serviceTags = ["ABC1234", "DEF5678", "GHI9012", "JKL3456", "MNO7890"];
for (let i = 0; i < 100; i++) {
  const baseTag = serviceTags[i % serviceTags.length];
  const tag = baseTag.slice(0, 4) + String(i % 10) + String(Math.floor(i / 10) % 10) + String(Math.floor(i / 100) % 10);
  devices.push({
    service_tag: tag,
    customer_id: String((i % 4) + 1),
    customer_name: users[(i % 4)].username,
    customer_email: users[(i % 4)].email,
    customer_address: users[(i % 4)].address,
    model: `Dell Laptop Model ${i % 10}`,
    serial_number: `SN${tag}${i}`,
    warranty_status: i % 2 === 0 ? "active" : "expired",
    purchase_date: new Date(2023, i % 12, 1).toISOString()
  });
}

module.exports = {
  devices,
  findDeviceByServiceTag: (tag) => devices.find(d => d.service_tag === tag)
};

