import jwt  from "jsonwebtoken"
import User from "../schemas/userSchemas.js"

const protectedRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      res.status(401).json({ error: "unauthorized - no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      res.status(401).json({ error: "unauthorized -invalid token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(404).json({ error: "user not found" });
    }
    res.user = user
    next()
  } catch (error) {
    console.log("error is in middleware", error.message);
    res.status(500).json("internal server error");
  }
};

export default protectedRoute;
