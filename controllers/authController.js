const bcrypt = require("bcryptjs");
const User = require("../models/User");

exports.getRegister = (req, res) => {
    res.render("register");
};

exports.postRegister = async (req, res) => {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.redirect("/register");

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
        name,
        email,
        password: hashedPassword
    });
    req.session.userId = newUser._id;

    res.redirect("/dashboard");
};

exports.getLogin = (req, res) => {
    res.render("login");
};

exports.postLogin = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.redirect("/login");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.redirect("/login");

    req.session.regenerate((err) => {
        if (err) {
            console.log(err);
            return res.redirect("/login");
        }
        
        req.session.userId = user._id;

        if (user.role === "admin") {
            return res.redirect("/admin/dashboard");
        } else {
            return res.redirect("/dashboard");
        }
    });
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.redirect("/login");
    });
};