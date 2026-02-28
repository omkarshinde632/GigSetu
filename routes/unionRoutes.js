const router = require("express").Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const UnionPost = require("../models/UnionPost");
const UnionMeeting = require("../models/UnionMeeting");

router.get("/", isAuthenticated, async (req, res) => {

  const posts = await UnionPost.find()
    .populate("user")
    .sort({ createdAt: -1 });

  const meetings = await UnionMeeting.find()
    .sort({ meetingDate: 1 });

  res.render("union", { posts, meetings });
});

router.post("/post", isAuthenticated, async (req, res) => {

  const { title, description, platform } = req.body;

  await UnionPost.create({
    user: req.session.userId,
    title,
    description,
    platform
  });

  res.redirect("/union");
});

router.post("/upvote/:id", isAuthenticated, async (req, res) => {

  const post = await UnionPost.findById(req.params.id);
  const userId = req.session.userId;

  if (!post.upvotes.includes(userId)) {
    post.upvotes.push(userId);
    await post.save();
  }

  res.redirect("/union");
});

router.post("/meeting", isAuthenticated, async (req, res) => {

  const { title, description, meetingDate, location } = req.body;

  await UnionMeeting.create({
    title,
    description,
    meetingDate,
    location,
    createdBy: req.session.userId
  });

  res.redirect("/union");
});

console.log(typeof UnionMeeting);
console.log(UnionMeeting);

module.exports = router;