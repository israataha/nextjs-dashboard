import { sql } from '@vercel/postgres';
import {
  CustomersTableType,
  User,
  Status
} from './definitions';
import { formatCurrency } from './utils';
import prisma from './prisma';
import { unstable_noStore as noStore } from 'next/cache';

export async function fetchRevenue() {
  // Add noStore() here prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  noStore();

  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await prisma.revenue.findMany();

    console.log('Data fetch completed after 3 seconds.');

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  noStore();

  try {
    const data = await prisma.invoice.findMany({
      select: {
        id: true,
        amount: true,
        customer: true,
      },
      orderBy: [
        { date: 'desc' }
      ],
      take: 5
    })

    const latestInvoices = data.map((invoice) => ({
      ...invoice.customer,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  noStore();

  try {
    const invoiceCountPromise = prisma.invoice.count();
    const customerCountPromise = prisma.customer.count();
    const paidInvoicesPromise = prisma.invoice.aggregate({
      where: {
        status: { equals: 'paid' }
      },
      _sum: { amount: true }
    });
    const pendingInvoicesPromise = prisma.invoice.aggregate({
      where: { status: { equals: 'pending' }
      },
      _sum: { amount: true }
    });

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      paidInvoicesPromise,
      pendingInvoicesPromise
    ]);

    const numberOfInvoices = Number(data[0] ?? '0');
    const numberOfCustomers = Number(data[1] ?? '0');
    const totalPaidInvoices = formatCurrency(data[2]._sum.amount ?? 0);
    const totalPendingInvoices = formatCurrency(data[3]._sum.amount ?? 0);

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const data = await prisma.invoice.findMany({
      select: {
        id: true,
        amount: true,
        date: true,
        status: true,
        customer: true
      },
      where: {
        OR: [
          { date: { contains: query }},
          { status: { contains: query }},
          { customer: { name: { contains: query }}},
          { customer: {email: { contains: query }}},
        ]
      },
      orderBy: [
        { date: 'desc' }
      ],
      take: ITEMS_PER_PAGE,
      skip: offset
    });

    const invoices = data.map((invoice) => ({
        ...invoice,
        name: invoice.customer.name,
        email: invoice.customer.email,
        image_url: invoice.customer.image_url
    }));
    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  noStore();
  try {
    const count = await prisma.invoice.count({
      where: {
        OR: [
          { date: { contains: query }},
          { status: { contains: query }},
          { customer: { name: { contains: query }}},
          { customer: {email: { contains: query }}},
        ]
      },
    })

    const totalPages = Math.ceil(Number(count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  noStore();
  try {
    const data = await prisma.invoice.findMany({
      select: { 
        id: true,
        customer_id: true,
        amount: true,
        status: true
      },
      where: {
        id: { equals: parseInt(id)}
      }
    });

    const invoice = data.map((invoice) => ({
      ...invoice,
      id: invoice.id.toString(),
      status: invoice.status as Status,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const data = await prisma.customer.findMany({
      select: { id: true, name: true},
      orderBy: [{ name: 'asc'}]
    });
  
    const customers = data;
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function getUser(email: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email
      }
    });
    return user as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}