import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import generateToken from "../utils/generateToken.js";

// SIGNUP
export const signup = async (req, res) => {
  try {
    const { companyName, country, currency, name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const company = await Company.create({
      name: companyName,
      country,
      currency,
    });

    const user = await User.create({
      name,
      email,
      password,
      role: "admin",
      companyId: company._id,
    });

    company.createdBy = user._id;
    await company.save();

    res.json({
      token: generateToken(user._id),
      user,
      company,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("companyId");

    if (user && (await user.comparePassword(password))) {
      res.json({
        token: generateToken(user._id),
        user,
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ME
export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("companyId")
    .select("-password");

  res.json(user);
};