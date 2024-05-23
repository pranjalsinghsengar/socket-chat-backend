const generateToken = require("../jwt_token/generateToken");
const User = require("../schemas/userSchemas");

async function HandlerSignUp(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }
    const newUser = new User({
      name,
      email,
      password,
    });
    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();
    }

    return res.json({ success: true, message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

async function HandlerLogin(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });


  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email or password" });
  }

    
  generateToken(user._id, res)
  res.json({ success: true, user: user });
}
async function HandlerLogout(req, res) {
  try {
    res.cookie("jwt", "", {maxAge:0})
    res.json({ success: true, message: "User logged out successfully" });
    
  } catch (error) {
    console.error("Error logging out:", error);
    return res
     .status(500)
     .json({ success: false, message: "Internal server error" });
  }
}

module.exports = { HandlerSignUp, HandlerLogin,HandlerLogout };
