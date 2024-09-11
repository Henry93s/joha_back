const { Router } = require("express");
const asyncHandler = require("../middlewares/async-handler");
const classService = require("../services/classService");
// multer 이미지 업로드 설정 가져오기
const upload = require("../utils/multerConfig");

const router = Router();

/* create  */
router.post(
  "/",
  upload.array("photo"),
  asyncHandler(async (req, res) => {
    const bodyData = req.body;
    const imageFiles =
      !req.files || req.files.length === 0 ? ["notFound"] : req.files;
  })
);

/* 전체 레슨 조회 */
router.get(
  "/",
  asyncHandler(async (req, res) => {})
);

/* nanoid 로 특정 레슨 조회 */
router.get(
  "/nanoid",
  asyncHandler(async (req, res) => {
    const { nanoid } = req.body;
    const result = await classService.findOneClass(nanoid);
    return res.status(200).json(result);
  })
);

// update (수정)
router.put(
  "/",
  upload.array("photo"),
  asyncHandler(async (req, res) => {})
);

// delete (삭제)
router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const { nanoid } = req.body;
    const result = await classService.deleteClass({ nanoid });
    return res.status(200).json(result);
  })
);

module.exports = router;
