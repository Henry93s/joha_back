const { User, Class } = require("../models");
const newDate = require("../utils/newDate");
const crypto = require("crypto");
const imageToAWS = require("../utils/imageToAWS");
const deleteImageFromAWS = require("../utils/deleteImageFromAWS");

class ClassService {
    // create
    async writeClass(bodyData, imageFiles){
        const author = await User.findOne({email: bodyData.email}, "email name phone photo");
        const myClass = await Class.find({author: author});
        if(myClass && myClass.length >= 4){
            const error = new Error();
            Object.assign(error, {code: 400, message: "한 계정당 4개의 클래스까지 등록할 수 있습니다."});
            throw error;
        }

        // aws 버킷에 옮기기 전 이미지 가공 + 버킷 옮기기 + url 반환 작업(util 로 옮김)
        const fixedImageUrl = [];
        const main_image_arr = [imageFiles[0]];
        // `imageToAWS`가 배열을 반환하므로 배열을 전개해 추가한다.
        const mainImageUrl = await imageToAWS(main_image_arr);
        fixedImageUrl.push(...mainImageUrl); 

        let sub_images_arr = [];
        if (imageFiles.length > 1) {
            sub_images_arr = imageFiles.slice(1);
            const subImageUrls = await imageToAWS(sub_images_arr);
            fixedImageUrl.push(...subImageUrls); 
        }
        
        bodyData.imageUrl = fixedImageUrl;
        // s3 이미지 url
        // main_image <-> sub_images 분리시킴
        const main_image = bodyData.imageUrl[0];
        let sub_images;
        if(bodyData.imageUrl.length > 1){
            sub_images = bodyData.imageUrl.slice(1);
        } else {
            sub_images = [];
        }

        const data = await Class.create({
            author: author,
            title: bodyData.title,
            main_available_time: bodyData.main_available_time,
            sub_available_times: bodyData.sub_available_times,
            like: Number(bodyData.like),
            star: Number(bodyData.star),
            main_location: bodyData.main_location,
            sub_location: bodyData.sub_location,
            duration_time: Number(bodyData.duration_time),
            contents: bodyData.contents,
            introduce: bodyData.introduce,
            price: Number(bodyData.price),
            main_image: main_image,
            sub_images: sub_images,
            is_premium: bodyData.is_premium
        });
        return {data: data, code: 200, message: `레슨 등록 완료`};
    };

  // all class select

  // one class select
  async findOneClass(nanoid) {
    const oneClass = Class.findOne(
      { nanoid },
      "nanoid author main_image sub_images title main_available_time sub_available_time main_location sub_location duration_time price contents introduce is_premium like star comments create_at update_at"
    );
    return { data: oneClass, code: 200, message: "클래스 조회 완료" };
  }
  
  // update
  async putClass(bodyData, imageFiles){
      const nanoid = bodyData.nanoid;
      const lesson = await Class.findOne({nanoid}).populate('author').populate({
          path: 'author',
          select: "email name phone photo"
      });
      if(!lesson) { 
          const error = new Error();
          Object.assign(error, {code: 400, message: "레슨 정보를 가져오지 못했습니다. 다시 확인해주세요."});
          throw error;
      }
      if(lesson.author.email !== bodyData.email) { 
          const error = new Error();
          Object.assign(error, {code: 403, message: "레슨 작성자가 아닙니다. 다시 확인해주세요."});
          throw error;
      }

      // 수정할 이미지가 있을 때 (if)
      if(imageFiles.length > 0){
          // 1. 기존 post 이미지 url 을 s3 버킷에서 삭제
          // main_image 수정: 1, sub_images 수정: 2, 둘 다 수정: 3
          let deleteFiles = [];
          if(bodyData.mode === "1"){
              if(imageFiles.length > 1){
                  const error = new Error();
                  Object.assign(error, {code: 400, message: "메인 이미지는 2장 이상이 될 수 없습니다."});
                  throw error;
              }
              deleteFiles.push(post.main_image);
          } else if (bodyData.mode === "2"){             
              deleteFiles = post.sub_images;
          } else if(bodyData.mode === "3"){
              // sub_images 배열의 모든 값과 메인 이미지 를 push 한다.
              deleteFiles.push(...post.sub_images, post.main_image);
          }
          await deleteImageFromAWS(deleteFiles);
          // 2. 새로운 이미지를 sharp 처리
          // 3. 새로운 이미지를 버킷에 넣고 url 반환
          // 4. url 을 가공해서 bodyData.main_image, bodyData.sub_images 에 삽입
          // aws 버킷에 옮기기 전 이미지 가공 + 버킷 옮기기 + url 반환 작업(util 로 옮김)
          const fixedImageUrl = [];
          const main_image_arr = [imageFiles[0]];
          // `imageToAWS`가 배열을 반환하므로 배열을 전개해 추가한다.
          const mainImageUrl = await imageToAWS(main_image_arr);
          fixedImageUrl.push(...mainImageUrl); 

          let sub_images_arr = [];
          if (imageFiles.length > 1) {
              sub_images_arr = imageFiles.slice(1);
              const subImageUrls = await imageToAWS(sub_images_arr);
              fixedImageUrl.push(...subImageUrls); 
          }
          // s3 이미지 url
          // main_image 수정: 1, sub_images 수정: 2, 둘 다 수정: 3
          if(bodyData.mode === "1"){
              bodyData.main_image = fixedImageUrl[0];
          } else if(bodyData.mode === "2"){
              bodyData.sub_images = fixedImageUrl;
          } else if(bodyData.mode === "3"){
              bodyData.main_image = fixedImageUrl[0];
              bodyData.sub_images = fixedImageUrl.slice(1);
          }
      } 

      const update_at = newDate();
      bodyData.update_at = update_at;

      Reflect.deleteProperty(bodyData, "email");
      Reflect.deleteProperty(bodyData, "author");
      Reflect.deleteProperty(bodyData, "nanoid");
      // main_image 수정: 1, sub_images 수정: 2, 둘 다 수정: 3
      Reflect.deleteProperty(bodyData, "mode");

      await Class.updateOne({nanoid}, bodyData);
      return {code: 200, message: `레슨 수정 완료`};
  }


  // delete
  async deleteClass(nanoid) {
    const oneClass = await Class.findOne({ nanoid });
    if (!oneClass) {
      const error = new Error();
      Object.assign(error, {
        code: 404,
        message: "아이디로 조회된 클래스가 없습니다.",
      });
      throw error;
    } else {
      await Class.deleteOne(oneClass);
      return { code: 200, message: `${nanoid} 클래스 삭제 동작 완료` };
    }
  }
}

const classService = new ClassService();
module.exports = classService;
