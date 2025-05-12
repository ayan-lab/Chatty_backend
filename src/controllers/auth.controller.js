import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudnary.js";

//register
export const signup = async (req, res) => {
  const { email, fullname, password, profilepic } = req.body;
  
  try {
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt); 

    const newUser = new User({
      email,
      fullname,
      password: hashPassword,
      profilepic,
    });

    const savedUser = await newUser.save();
    generateToken(savedUser._id, res);

    res.status(201).json({
      _id: savedUser._id,
      email: savedUser.email,
      fullname: savedUser.fullname,
      profilepic: savedUser.profilepic,
    });
  } catch (error) {
    console.error("Invalid request", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


//login
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const checkUser = await User.findOne({ email });
    if (!checkUser) {
      return req.status(400).json({ message: "User not present !!" });
    }
    const checkPass = await bcrypt.compare(password, checkUser.password);
    if (!checkPass) {
      return req.status(400).json({ message: "Invalid password !!" });
    }
    generateToken(checkUser._id, res);
    res.status(200).json({
      _id: checkUser._id,
      email: checkUser.email,
      fullname: checkUser.fullname,
      profilepic: checkUser.profilepic,
    });
  } catch (error) {
    console.error("Invalid Credentials !!");
  }
};

//logout
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logout Successfully !!!" });
  } catch (error) {
    console.error("internal server error !!!");
  }
};

//update
export const updateProfile = async (req, res) => {
  try {
    const { profilepic } = req.body;
    const userId = req.user._id;

    if (!profilepic) {
      return res.status(400).json({ message: "Profile pic needed !!" });
    }
    const uploadResponse = await cloudinary.uploader.upload(profilepic);
    const updateUser = await User.findByIdAndUpdate(
      userId,
      { profilepic: uploadResponse.secure_url },
      { new: true }
    );
    res.status(200).json(updateUser);
  } catch (error) {
    console.error("Error while uploading !!", error);
  }
};

//check auth
export const checkAuth = (req, res) => {
  try {
    res.status(200).json({message: "User is authenticated", user: req.user});
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
