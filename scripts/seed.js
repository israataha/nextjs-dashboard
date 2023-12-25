
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const {
  invoices,
  customers,
  revenue,
  users,
} = require('../app/lib/placeholder-data.js');
const bcrypt = require('bcrypt');

async function seedUsers() {
  try {
    // users = users.map(async (user) => ({
    //   ...user,
    //   password: await bcrypt.hash(user.password, 10)
    // }));

    // Insert data into the "users" table
    const insertedUsers = await prisma.user.createMany({
      data: users
    });

    console.log(`Seeded ${insertedUsers.count} users`);
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

async function seedInvoices() {
  try {
    // Insert data into the "invoices" table
    const insertedInvoices = await prisma.invoice.createMany({
      data: invoices
    })

    console.log(`Seeded ${insertedInvoices.count} invoices`);
  } catch (error) {
    console.error('Error seeding invoices:', error);
    throw error;
  }
}

async function seedCustomers() {
  try {
    // Insert data into the "customers" table
    const insertedCustomers = await prisma.customer.createMany({
      data: customers
    });

    console.log(`Seeded ${insertedCustomers.count} customers`);
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
}

async function seedRevenue() {
  try {
    // Insert data into the "revenue" table
    const insertedRevenue = await prisma.revenue.createMany({
      data: revenue
    });

    console.log(`Seeded ${insertedRevenue.count} revenue`);
  } catch (error) {
    console.error('Error seeding revenue:', error);
    throw error;
  }
}

async function main() {
  await seedUsers();
  await seedCustomers();
  await seedInvoices();
  await seedRevenue();
}

main().catch((err) => {
  console.error(
    'An error occurred while attempting to seed the database:',
    err,
  );
}).finally(async () => {
  await prisma.$disconnect()
});
