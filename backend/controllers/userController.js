import User from "../models/user.model.js";

export const createUser = async (req, res) => {
  const { name, email, password, role, managerId } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role,
    companyId: req.user.companyId,
    managerId,
  });

  res.json(user);
};

export const getUsers = async (req, res) => {
  const users = await User.find({ companyId: req.user.companyId }).select(
    "-password"
  );

  res.json(users);
};