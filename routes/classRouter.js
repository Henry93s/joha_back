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

    bodyData.email = req.user.email;
    // 요청 파일 없음 에러(임의의 코드 : 410)
    if(!req.files || req.files.length === 0){
        return res.status(400).json({code: 410, message: "요청에 이미지 파일이 없습니다."});
    }
    const result = await classService.writeClass(bodyData, req.files);
    return res.status(200).json(result);
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
router.put('/', upload.array('photo'), asyncHandler(async (req, res) => {
    // 레슨 정보에 추가로 로그인된 사용자 email 이 있어야 함 *front 에서도 체크해야 함
    const bodyData = req.body;
    bodyData.email = req.user.email;

    const result = await classService.putClass(bodyData, req.files ? req.files : []);
    return res.status(200).json(result);
}));

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
