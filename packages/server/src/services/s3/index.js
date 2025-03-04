const express = require("express");
const { authenticate } = require("../../authentication");
const router = express.Router();
const { generateUploadURL, generateUpdateURL, generateDeleteURL } = require("./utils");

router.use(authenticate);

router.get("/:ext", [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== "true" && req.user?.isBrand !== "true") {
      res.status(403).send("User is not an admin or brand");
      return;
    } else {
      const ext = req.params.ext;
      const url = await generateUploadURL(ext);
      res.send({ url });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get("/update/:fileNameWithExt", [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== "true" && req.user?.isBrand !== "true") {
      res.status(403).send("User is not an admin or brand");
      return;
    } else {
      const fileNameWithExt = req.params.fileNameWithExt;
      const url = await generateUpdateURL(fileNameWithExt);
      res.send({ url });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get("/delete/:fileNameWithExt", [], async (req, res) => {
  try {
    if (req.user?.isAdmin !== "true" && req.user?.isBrand !== "true") {
      res.status(403).send("User is not an admin or brand");
      return;
    } else {
      const fileNameWithExt = req.params.fileNameWithExt;
      const url = await generateDeleteURL(fileNameWithExt);
      res.send({ url });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: "/s3url",
  router,
};
