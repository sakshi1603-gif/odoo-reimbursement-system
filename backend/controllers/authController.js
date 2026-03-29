import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import generateToken from "../utils/generateToken.js";
import catchAsync from "../utils/catchAsync.js";

// POST /api/auth/signup
export const signup = catchAsync(async (req, res) => {
  const { companyName, country, currency, name, email, password } = req.body;

  if (!companyName || !name || !email || !password) {
    return res.status(400).json({ message: "companyName, name, email and password are required" });
  }

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) {
    return res.status(400).json({ message: "An account with this email already exists" });
  }

  const company = await Company.create({
    name: companyName,
    baseCurrency: (currency || "USD").toUpperCase(),
    country: country || "",
  });

  const user = await User.create({
    name,
    email,
    password,
    role: "admin",
    companyId: company._id,
  });

  company.adminId = user._id;
  await company.save();

  res.status(201).json({
    token: generateToken(user._id),
    user,
    company,
  });
});

// POST /api/auth/login
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).populate("companyId");
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({
    token: generateToken(user._id),
    user,
    company: user.companyId,
  });
});

// GET /api/auth/me
export const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("companyId")
    .populate("managerId", "name email role");
  res.json(user);
});

// PATCH /api/auth/change-password
export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "newPassword must be at least 6 characters" });
  }

  const user = await User.findById(req.user._id);
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password changed successfully" });
});
