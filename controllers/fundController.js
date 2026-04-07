/**
 * Fund Controller
 * Handles adding deposits, withdrawals, fetching ledger, and balance.
 */

const TransactionModel = require('../models/transactionModel');
const UserModel = require('../models/userModel');

async function addTransaction(body, user) {
  const { user_id, amount, type, note } = body;

  if (!amount || !type) {
    return { status: 400, data: { error: 'Amount and type are required' } };
  }

  if (!['deposit', 'withdrawal'].includes(type)) {
    return { status: 400, data: { error: 'Type must be "deposit" or "withdrawal"' } };
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return { status: 400, data: { error: 'Amount must be a positive number' } };
  }

  // If withdrawing, check the balance
  if (type === 'withdrawal') {
    const balanceInfo = await TransactionModel.getTotalBalance();
    if (numAmount > parseFloat(balanceInfo.balance)) {
      return { status: 400, data: { error: 'Insufficient funds for this withdrawal' } };
    }
  }

  // user_id defaults to the admin performing the action, or can target a specific member
  const targetUserId = user_id || user.id;

  // Verify the target user exists
  const targetUser = await UserModel.findById(targetUserId);
  if (!targetUser) {
    return { status: 404, data: { error: 'Target user not found' } };
  }

  const transaction = await TransactionModel.create(
    targetUserId,
    numAmount,
    type,
    note || '',
    user.id // recorded_by = the admin performing this
  );

  return {
    status: 201,
    data: {
      message: `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} recorded successfully`,
      transaction,
    },
  };
}

async function getLedger() {
  const transactions = await TransactionModel.getAll();
  const balanceInfo = await TransactionModel.getTotalBalance();

  return {
    status: 200,
    data: {
      transactions,
      summary: {
        total_deposits: parseFloat(balanceInfo.total_deposits),
        total_withdrawals: parseFloat(balanceInfo.total_withdrawals),
        balance: parseFloat(balanceInfo.balance),
      },
    },
  };
}

async function getBalance() {
  const balanceInfo = await TransactionModel.getTotalBalance();
  return {
    status: 200,
    data: {
      total_deposits: parseFloat(balanceInfo.total_deposits),
      total_withdrawals: parseFloat(balanceInfo.total_withdrawals),
      balance: parseFloat(balanceInfo.balance),
    },
  };
}

module.exports = { addTransaction, getLedger, getBalance };
