const { Router } = require("express");
const asyncHandler = require("../middlewares/async-handler");
const storyService = require("../services/storyService");
// multer 이미지 업로드 설정 가져오기
const upload = require("../utils/multerConfig");
const reqUserCheck = require("../middlewares/reqUserCheck");

const router = Router();

/* create  */
router.post(
  "/", reqUserCheck,
  upload.array("photo"), 
  asyncHandler(async (req, res) => {
    const bodyData = req.body;

    bodyData.email = req.user.email;
    // 요청 파일 없음 에러(임의의 코드 : 410)
    if(!req.files || req.files.length === 0){
        return res.status(400).json({code: 410, message: "요청에 메인 이미지 파일이 없습니다."});
    }
    const imageFiles = req.files;
    const result = await storyService.writeStory(bodyData, imageFiles);
    return res.status(200).json(result);
  })
);

/* 전체 스토리 조회 */
router.get(
    "/read/all",
    asyncHandler(async (req, res) => {
      const result = await storyService.findAllStory();
      return res.status(200).json(result);
    }),
);

/* title로 검색되는 스토리 조회 */
router.get(
    "/search",
    asyncHandler(async (req, res) => {
        const { title } = req.query;
        const result = await storyService.findClassByStory(title);
        return res.status(200).json(result);
    }),
);

/* nanoid 로 특정 스토리 조회 */
router.get(
    "/read/:nanoid",
    asyncHandler(async (req, res) => {
      const {nanoid} = req.params;
      const result = await storyService.findStoryById(nanoid);
      return res.status(200).json(result);
    }),
);

// update (수정)
router.put('/', reqUserCheck, upload.array('photo'), asyncHandler(async (req, res) => {
    // 스토리 정보에 추가로 로그인된 사용자 email 이 있어야 함 *front 에서도 체크해야 함
    const bodyData = req.body;
    bodyData.email = req.user.email;

    const result = await storyService.putStory(bodyData, req.files ? req.files : []);
    return res.status(200).json(result);
}));

// delete (삭제)
router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const { nanoid } = req.body;
    const result = await storyService.deleteStory({ nanoid });
    return res.status(200).json(result);
  })
);

// 스토리 리스트 페이지 정보 read
// search parameter 추가 필요
router.post('/page', asyncHandler(async (req,res) => { 
  const {mymode} = req.body;
  const email = req.user ? req.user.email : "";
  const result = await storyService.getStoryesPage({mymode, email});
  return res.status(200).json(result);
}));

// 스토리 리스트 목록 read
// search parameter 추가 필요
router.post('/page/read', asyncHandler(async (req,res) => {
  const {nowpage, mymode} = req.body;
  const email = req.user ? req.user.email : "";
  const result = await storyService.getStoryes({nowpage, mymode, email});
  return res.status(200).json(result);
}));

module.exports = router;
