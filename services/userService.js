const { User, Verify } = require("../models");
const code = require("../utils/data/code");
const generateRandomValue = require("../utils/generate-random-value");
const sendEmail = require("../utils/nodemailer");
const newDate = require("../utils/newDate");
// sha256 단방향 해시 비밀번호 사용
const crypto = require("crypto");
// aes128(front) 비밀번호 복호화
const decryptPassword = require("../utils/decryptPassword");
const imageToAWS = require("../utils/imageToAWS");
const deleteImageFromAWS = require("../utils/deleteImageFromAWS");

class UserService {
    /* create 완료 */
    async createUser(bodyData, imageFiles) {
        // 이메일 인증이 정상적으로 되었는지(is_verified === true) 검사
        const { email } = bodyData;
        const verify = await Verify.findOne({ data: email, code: code.VERIFYCODE });
        if (!verify) {
            const error = new Error();
            Object.assign(error, { code: 401, message: "이메일 인증을 먼저 진행해주세요." });
            throw error;
        }
        if (!verify.is_verified) {
            const error = new Error();
            Object.assign(error, {
                code: 401,
                message: "이메일 인증이 되지 않았습니다. 메일에서 인증 코드를 확인해주세요.",
            });
            throw error;
        }

        // 전화번호 중복 확인
        const { phone } = bodyData;
        const phoneUser = await User.findOne({ phone });
        if (phoneUser) {
            const error = new Error();
            Object.assign(error, {
                code: 400,
                message: "중복된 전화번호입니다. 전화번호를 변경해주세요.",
            });
            throw error;
        }

        // 이메일 인증이 되었고 회원가입을 진행하므로 더 이상 쓸모가 없으므로 제거
        await Verify.deleteMany(verify);

        // front 암호화 적용 시 주석 해제
        // password 를 백엔드에 보내 줄 때 aes-128 양방향 암호화 적용
        // 백엔드에서는 aes-128 을 복호화하고 sha-256 해시화하여 db sha-256 해시 값과 비교시킨다.
        const key = process.env.AES_KEY;
        const decryptedPassword = decryptPassword(bodyData.password, key);

        // 실제 프론트에서 이미지 확장자 검사, 파일 용량 검사 수행해서 넘어옴 !
        // aws 버킷에 옮기기 전 이미지 가공 + 버킷 옮기기 + url 반환 작업(util 로 옮김)
        let photo;
        if (imageFiles[0] !== "notFound") {
            const main_image_arr = [imageFiles[0]];
            // `imageToAWS`가 배열을 반환하므로 배열을 전개해 추가한다.
            const mainImageUrl = await imageToAWS(main_image_arr);
            photo = mainImageUrl[0];
        } else {
            photo = "notFoundImage";
        }

        // sha256 단방향 해시 비밀번호 사용
        const hash = crypto.createHash("sha256").update(decryptedPassword).digest("hex");
        const newUser = await User.create({
            email: bodyData.email,
            name: bodyData.name,
            phone: bodyData.phone,
            password: hash,
            photo: photo,
            base_address: bodyData.base_address,
            detail_address: bodyData.detail_address,
            is_admin: false,
        });
        return { code: 200, message: `${bodyData.email} 계정으로 회원가입이 성공하였습니다.` };
    }

    // 인증 요청 분리 *(비밀번호 찾기 - 이메일이 존재해야 다음 스텝으로 넘어가야 함)
    async pwfindVerify({ email }) {
        // 인증 코드 받는 이메일이 이미 존재하는지 검사
        // 이메일 인증이 정식으로 들어갈 때 createUser 에 있는 이메일 존재 검사는 필요없음.
        const user = await User.findOne({ email });
        // 기존 회원가입 인증 요청 부분과의 차이점
        if (!user) {
            const error = new Error();
            Object.assign(error, { code: 400, message: "회원가입 되어 있지 않은 이메일입니다." });
            throw error;
        }

        // 기존 verify 데이터가 있을 시 새 secret 으로 변경
        const newSecret = generateRandomValue(code.PASSWORD);
        const verify = await Verify.findOne({ data: email, code: code.PASSWORD });
        if (verify) {
            await Verify.updateOne({ data: email, code: code.PASSWORD, secret: newSecret });
        } else {
            // 기존 verify 가 없을 때 새 verify document 생성
            await Verify.create({ data: email, code: code.PASSWORD, secret: newSecret });
        }

        // 이메일 전송
        const subject = "비밀번호 찾기 이메일 인증 코드를 확인해주세요.";
        const text = `이메일 인증 코드 : ${newSecret}`;
        const result = await sendEmail(email, subject, text);
        if (result === 1) {
            return { code: 200, message: "인증 코드가 정상 발송되었습니다." };
        } else {
            const error = new Error();
            Object.assign(error, { code: 400, message: "메일 인증 코드가 발송되지 않았습니다." });
            throw error;
        }
    }

    // 회원 가입 메일 인증 코드 발급
    async joinVerify({ email }) {
        // 인증 코드 받는 이메일이 이미 존재하는지 검사
        // 이메일 인증이 정식으로 들어갈 때 createUser 에 있는 이메일 존재 검사는 필요없음.
        const user = await User.findOne({ email });
        if (user) {
            const error = new Error();
            Object.assign(error, { code: 400, message: "이미 회원가입 되어 있는 이메일입니다." });
            throw error;
        }

        // 기존 verify 데이터가 있을 시 새 secret 으로 변경
        const newSecret = generateRandomValue(code.VERIFYCODE);
        const verify = await Verify.findOne({ data: email, code: code.VERIFYCODE });
        if (verify) {
            await Verify.updateOne({ data: email, code: code.VERIFYCODE, secret: newSecret });
        } else {
            // 기존 verify 가 없을 때 새 verify document 생성
            await Verify.create({ data: email, code: code.VERIFYCODE, secret: newSecret });
        }

        // 이메일 전송
        const subject = "회원가입 이메일 인증 코드를 확인해주세요.";
        const text = `이메일 인증 코드 : ${newSecret}`;
        const result = await sendEmail(email, subject, text);
        if (result === 1) {
            return { code: 200, message: "인증 코드가 정상 발송되었습니다." };
        } else {
            const error = new Error();
            Object.assign(error, { code: 400, message: "메일 인증 코드가 발송되지 않았습니다." });
            throw error;
        }
    }

    // 인증 코드 확인 요청
    async joinVerifyConfirm({ email, secret }) {
        // verify document find
        // 6 자리는 회원가입 인증 코드 요청 길이
        let verify;
        // 회원가입에서 인증 코드 요청했었는지, 비밀번호 찾기에서 인증 코드 요청했었는지 판단 변수
        let myCode;

        if (secret.length !== 6 && secret.length !== 8) {
            const error = new Error();
            Object.assign(error, { code: 400, message: "인증 코드의 길이를 확인해주세요." });
            throw error;
        } else if (secret.length === 6) {
            myCode = code.VERIFYCODE;
            verify = await Verify.findOne({ data: email, code: code.VERIFYCODE });
            if (!verify) {
                const error = new Error();
                Object.assign(error, {
                    code: 400,
                    message: "인증 코드 길이 확인이 필요하거나, 인증 요청하지 않은 이메일 입니다.",
                });
                throw error;
            } else {
                // 인증 코드 비교 진행( 정상 인증 코드로 판단 시 is_verified 를 true 로 변경하여 회원가입 절차가 가능하도록 함)
                if (secret === verify.secret) {
                    await Verify.updateOne(
                        { data: email, code: code.VERIFYCODE },
                        {
                            is_verified: true,
                        },
                    );
                    return { code: 200, message: "이메일 인증 코드가 정상적으로 확인되었습니다." };
                } else {
                    await Verify.updateOne(
                        { data: email, code: code.VERIFYCODE },
                        {
                            is_verified: false,
                        },
                    );
                    const error = new Error();
                    Object.assign(error, { code: 400, message: "이메일 인증 코드를 다시 확인해주세요." });
                    throw error;
                }
            }
        }

        // 8 자리는 비밀번호 찾기 인증 코드 요청 길이
        else if (secret.length === 8) {
            myCode = code.PASSWORD;
            verify = await Verify.findOne({ data: email, code: code.PASSWORD });
            if (!verify) {
                const error = new Error();
                Object.assign(error, {
                    code: 400,
                    message: "인증 코드 길이 확인이 필요하거나, 인증 요청하지 않은 이메일 입니다.",
                });
                throw error;
            } else {
                if (secret === verify.secret) {
                    // 비밀번호 찾기는 비밀번호 찾기 요청 버튼을 눌렀을 때 인증 데이터 삭제하여야 함
                    await Verify.deleteMany({ data: email, code: code.PASSWORD });
                    return { code: 200, message: "이메일 인증 코드가 정상적으로 확인되었습니다." };
                } else {
                    await Verify.updateOne(
                        { data: email, code: code.PASSWORD },
                        {
                            is_verified: false,
                        },
                    );
                    const error = new Error();
                    Object.assign(error, { code: 400, message: "이메일 인증 코드를 다시 확인해주세요." });
                    throw error;
                }
            }
        }
    }

    // user ID 찾기 (이름과 휴대전화)
    async findUserID(bodyData) {
        const { name, phone } = bodyData;
        // name, phone 확인
        const user = await User.findOne({ name, phone });
        if (!user) {
            const error = new Error();
            Object.assign(error, { code: 404, message: "이름과 전화번호로 조회된 회원이 없습니다." });
            throw error;
        }
        return { data: user.email, code: 200, message: "유저 ID가 성공적으로 조회되었습니다. ID를 확인해주세요!" };
    }

    // update 수정
    async updateUser({ email }, bodyData, imageFiles) {
        // 부분 수정이 가능해야 하므로 => 기존 user 와 동일한 사용자와 중복일 경우는 pass 처리해야함
        // 기존 유저 정보
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error();
            Object.assign(error, { code: 404, message: "이메일로 조회된 회원이 없습니다." });
            throw error;
        }

        // 전화번호 중복 체크 후 업데이트
        if (bodyData.phone) {
            const { phone } = bodyData;
            const phoneUser = await User.findOne({ phone });
            // 수정한 전화번호를 이미 사용하는 다른 사용자가 있을 경우 중복처리
            if (phoneUser && phoneUser.email !== user.email) {
                const error = new Error();
                Object.assign(error, { code: 400, message: "중복된 전화번호입니다. 전화번호를 변경해주세요." });
                throw error;
            }
        }

        // 비밀 번호 수정사항이 있을 경우, sha256 단방향 해시 비밀번호 사용
        // 10자리 패스워드 프론트와 맞춤(특수문자 포함은 front 에서 체크 후 넘어옴)
        if (bodyData.password && bodyData.password.length >= 10) {
            // front 암호화 적용 시 주석 해제
            // password 를 백엔드에 보내 줄 때 aes-128 양방향 암호화 적용
            // 백엔드에서는 aes-128 을 복호화하고 sha-256 해시화하여 db sha-256 해시 값과 비교시킨다.
            const key = process.env.AES_KEY;
            const decryptedPassword = decryptPassword(bodyData.password, key);

            // sha256 단방향 해시 비밀번호 사용
            const hash = crypto.createHash("sha256").update(decryptedPassword).digest("hex");
            bodyData.password = hash;
        } else {
            Reflect.deleteProperty(bodyData, "password");
        }

        // 실제 프론트에서 이미지 확장자 검사, 파일 용량 검사 수행해서 넘어옴 !
        // 프로필 사진을 수정할 때 기존 s3 버킷 이미지 삭제 후 -> s3 이미지 sharp 처리 후 넣기 -> url 반환 처리 예정
        if (imageFiles[0] !== "notFound") {
            let deleteFiles = [];

            // 기존 이미지를 삭제하기 위한 조건 추가 (기존 이미지가 'notFoundImage'가 아닌 경우)
            if (user.photo && user.photo !== "notFoundImage") {
                deleteFiles.push(user.photo);
                await deleteImageFromAWS(deleteFiles);
            }

            const main_image_arr = [imageFiles[0]];
            const mainImageUrl = await imageToAWS(main_image_arr);
            // bodyData에 url 반환 후 저장
            bodyData.photo = mainImageUrl[0];
        } else {
            // 이미지를 수정하지 않았다면 기존 이미지를 그대로 사용
            bodyData.photo = user.photo;
        }

        // update 날짜 부여
        bodyData.update_at = newDate();

        // 수정할 수 없는 정보가 bodyData 에 들어있을 경우 해당 프로퍼티를 bodyData 에서 제거
        Reflect.deleteProperty(bodyData, "email");
        Reflect.deleteProperty(bodyData, "is_admin");
        Reflect.deleteProperty(bodyData, "name");
        Reflect.deleteProperty(bodyData, "create_at");

        await User.updateOne(user, bodyData);
        return { code: 200, message: `${email} 사용자 수정 동작 완료` };
    }

    // delete 삭제
    async deleteUser({ email }) {
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error();
            Object.assign(error, { code: 404, message: "탈퇴한 회원 또는 이메일로 조회된 회원이 없습니다." });
            throw error;
        } else {
            // (삭제 전에 유저가 작성한 글, 댓글 등 먼저 삭제가 필요할 수 있음 !)
            if (user.photo !== "notFoundImage") {
                let deleteFiles = [];
                deleteFiles.push(user.photo);
                await deleteImageFromAWS(deleteFiles);
            }
            await User.deleteOne(user);
            return { code: 200, message: `${email} 사용자 삭제 동작 완료` };
        }
    }

    /* find all 전체 유저 찾기 */
    async findAllUser() {
        // 원하는 속성들만 찾기
        // 실제 서비스에서는 유저가 매우 많을 때(1000명 이상 등) 을 고려하여 페이지네이션이 있으면 좋음 (피드백 사항)
        const users = await User.find(
            {},
            "email name phone photo base_address detail_address is_admin create_at update_at",
        );
        return users;
    }
    // findOne by email 이메일로 유저 찾기
    async findByEmail({email}) {
        // console.log(email);
        const user = await User.findOne(
            { email },
            "email name phone photo base_address detail_address is_admin create_at update_at",
        );
        if (!user) {
            const error = new Error();
            Object.assign(error, {
                data: [],
                code: 404,
                message: "이메일로 조회된 회원이 없습니다.",
            });
            throw error;
        }
        return { data: user, code: 200, message: "사용자 조회 완료" };
    }
}

const userService = new UserService();
module.exports = userService;
