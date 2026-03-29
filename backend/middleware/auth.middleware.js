import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Verify JWT and attach user to request
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Role guards — always use after verifyToken
export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export const isManager = (req, res, next) => {
  if (req.user.role !== "manager" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Manager access required" });
  }
  next();
};

export const isEmployee = (req, res, next) => {
  if (!["admin", "manager", "employee"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

// Ensure the acting user belongs to the same company as the resource
export const sameCompany = (req, res, next) => {
  const companyIdParam =
    req.params.companyId || req.body.companyId || req.query.companyId;
  if (
    req.user.role !== "admin" &&
    companyIdParam &&
    req.user.companyId?.toString() !== companyIdParam.toString()
  ) {
    return res.status(403).json({ message: "Cross-company access denied" });
  }
  next();
};