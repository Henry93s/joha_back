const { Router } = require("express");
const asyncHandler = require("../middlewares/async-handler");
const classService = require("../services/classService");
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
    console.log(req.files)

    bodyData.email = req.user.email;
    // 요청 파일 없음 에러(임의의 코드 : 410)
    if(!req.files || req.files.length === 0){
        return res.status(400).json({code: 410, message: "요청에 이미지 파일이 없습니다."});
    }
    const imageFiles = req.files;
    const result = await classService.writeClass(bodyData, imageFiles);
    return res.status(200).json(result);
  })
);

/* 전체 레슨 조회 */
router.get(
    "/read/all",
    asyncHandler(async (req, res) => {
      const result = await classService.findAllClass();
      return res.status(200).json(result);
    }),
);

/* title로 검색되는 레슨 조회 */
router.get(
    "/search",
    asyncHandler(async (req, res) => {
        const { title } = req.query;
        const result = await classService.findClassByTitle(title);
        return res.status(200).json(result);
    }),
);

/* nanoid 로 특정 레슨 조회 */
router.get(
    "/read/:nanoid",
    asyncHandler(async (req, res) => {
      const {nanoid} = req.params;
      const result = await classService.findClassById(nanoid);
      return res.status(200).json(result);
    }),
);

// update (수정)
router.put('/', reqUserCheck, upload.array('photo'), asyncHandler(async (req, res) => {
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

// 수업 리스트 페이지 정보 read
// search parameter 추가 필요
router.post('/page', asyncHandler(async (req,res) => { 
  const {mymode} = req.body;
  // 사용자가 mymode(등록수업에서 내 수업만 요청하는지) 체크
  if(mymode && !req.user){
      return res.status(400).json({code: 400, message: "로그인하지 않은 사용자입니다."});
  }
  const email = req.user ? req.user.email : "";
  const result = await classService.getClassesPage({mymode, email});
  return res.status(200).json(result);
}));

// 수업 리스트 목록 read
// search parameter 추가 필요
router.post('/page/read', asyncHandler(async (req,res) => {
  const {nowpage, mymode} = req.body;
  // 사용자가 mymode(등록수업에서 내 수업만 요청하는지) 체크
  if(mymode && !req.user){
      return res.status(400).json({code: 400, message: "로그인하지 않은 사용자입니다."});
  }
  const email = req.user ? req.user.email : "";
  const result = await classService.getClasses({nowpage, mymode, email});
  return res.status(200).json(result);
}));

// 좋아요 버튼 동작 요청 라우터
router.post('/uppost', asyncHandler(async (req, res) => {
  const {email, nanoid} = req.body;
  const result = await classService.upPost({email, nanoid});
  return res.status(200).json(result);
}));

module.exports = router;
