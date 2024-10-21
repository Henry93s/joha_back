const { User, Story, Like } = require("../models");
const newDate = require("../utils/newDate");
const crypto = require("crypto");
const imageToAWS = require("../utils/imageToAWS");
const deleteImageFromAWS = require("../utils/deleteImageFromAWS");

class StoryService {
    // create
    async writeStory(bodyData, imageFiles){
        const author = await User.findOne({email: bodyData.email}, "email name phone photo");

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

        const data = await Story.create({
            author: author,
            title: bodyData.title,
            contents: bodyData.contents,
            main_image: main_image,
            sub_images: sub_images
        });
        return {data: data, code: 200, message: `스토리 등록 완료`};
    };

  // all Story select
    async findAllStory() {
        const Storyes = await Story.find();
        // (find()이 결과를 찾지 못하면 length === 0 을 반환함)
        if (Storyes.length === 0) {
            const error = new Error("조회된 스토리가 없습니다.");
            Object.assign(error, { code: 404, message: "조회된 스토리가 없습니다." });
            throw error;
        }
        return { code: 200, data: Storyes, message: "전체 스토리 조회 완료" };
    }

    // find Story by title
    async findStoryByTitle(title) {
        if (!title) {
            const error = new Error("제목이 필요합니다.");
            Object.assign(error, { code: 400 });
            throw error;
        }
        const titleStory = await Story.find({ title });
        // (find()이 결과를 찾지 못하면 length === 0 을 반환함)
        if (titleStory.length === 0) {
            const error = new Error("해당 제목으로 조회된 스토리가 없습니다.");
            Object.assign(error, { code: 404, message: "조회된 스토리가 없습니다." });
            throw error;
        }
        return { code: 200, data: titleStory, message: "타이틀로 조회 완료" };
    }

  // one Story select
  async findStoryById(nanoid) {
    const oneStory = await Story.findOne(
      { nanoid },
      "nanoid author main_image sub_images title contents like create_at update_at"
    );

    // (findOne()이 결과를 찾지 못하면 null을 반환함)
    if(!oneStory){ 
        const error = new Error("조회된 스토리가 없습니다.");
        Object.assign(error, { code: 404, message: "조회된 스토리가 없습니다." });
        throw error;
    }
    
    return { data: oneStory, code: 200, message: "스토리 조회 완료" };
  }
  
  // update
  async putStory(bodyData, imageFiles){
      const nanoid = bodyData.nanoid;
      const classs = await Story.findOne({nanoid}).populate('author').populate({
          path: 'author',
          select: "email name phone photo"
      });
      if(!classs) { 
          const error = new Error();
          Object.assign(error, {code: 400, message: "스토리 정보를 가져오지 못했습니다. 다시 확인해주세요."});
          throw error;
      }
      if(classs.author.email !== bodyData.email) { 
          const error = new Error();
          Object.assign(error, {code: 403, message: "스토리 작성자가 아닙니다. 다시 확인해주세요."});
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

      await Story.updateOne({nanoid}, bodyData);
      return {code: 200, message: `스토리 수정 완료`};
  }


  // delete
  async deleteStory({nanoid}) {
    const oneStory = await Story.findOne({ nanoid });
    if (!oneStory) {
      const error = new Error();
      Object.assign(error, {
        code: 404,
        message: "아이디로 조회된 스토리가 없습니다.",
      });
      throw error;
    } else {
      await Story.deleteOne(oneStory);
      return { code: 200, message: `${nanoid} 스토리 삭제 동작 완료` };
    }
  }

  // 페이지 정보 read (mymode && 등록수업 페이지에서 내가 등록한 수업만 보기)
  async getStoryesPage({mymode, /* search, */ email}){
    // 첫 페이지 진입이므로 1 고정
    const page = 1;
    const perPage = 6;

    // search 페이지 분석 체크 필요
    /*
    const query = {
        $and: [
            // 메인 검색 처리
            ...
    
            // 메인 태그 검색

            // 세부 태그 검색
            ...
        ]
    }
    */
    
    // 먼저 검색 결과 데이터를 구함 (주석 처리 부분)
    let checkStoryes;
    /*
    if(!mymode){
        // MongoDB의 Aggregation Framework 를 사용하여 "여러 단계의 쿼리와 필터링을 연속" 으로 수행 가능
        checkStoryes = await Story.aggregate([
            // 조건에 맞는 게시물 조회
            
            { $match: query },
            
            
            // Reserve 컬렉션과 조인
            {
                $lookup: {
                    from: 'reserves',        // Reserve 컬렉션의 실제 이름(몽고 compass 확인 시 실제 컬렉션 이름은 소문자 복수형으로 쓰인다)
                    localField: 'nanoid',    // Story의 nanoid 필드
                    foreignField: 'Story_nanoid', // Reserve의 Story_nanoid 필드
                    as: 'reservations'       // 결과 필드 이름을 reservations 로 지어 join 했다.
                }
            },
            // 시간 범위에 맞는 예약 데이터 필터링
            {
                
                $addFields: {
                    reservations: {
                        $filter: {
                            input: '$reservations',
                            as: 'reservation',
                            cond: {
                                // reserve 의 start_time 가 search 의 endTime 보다 작고,
                                // reserve 의 end_time 가 search 의 startTime 보다 크다. => 의 예약 데이터를 필터링 해야한다.
                                // (start_time === search.endTime 일 수 도 있고
                                //    end_time === search.startTime 일 수도 있다.)
                                $and: [
                                    { $lt: [ { $dateFromString: { dateString: '$$reservation.start_time' } }, new Date(search.endTime) ] },
                                    { $gt: [ { $dateFromString: { dateString: '$$reservation.end_time' } }, new Date(search.startTime) ] }
                                ]
                            }
                        }
                    }
                }
                
            },
            // 예약이 없는 게시물만 필터링
            {
                $match: {
                    reservations: { $eq: [] }
                }
            }
        ]);
    } else {
    */
        const user = await User.findOne({email});
        checkStoryes = await Story.find({author: user});
    // }

    let resultStoryes = checkStoryes;

    const total = resultStoryes.length;
    const totalPage = Math.ceil(total/perPage);

    const data = {
        page: page,
        perPage: perPage,
        total: total,
        totalPage: totalPage
    };

    return {result: data, code: 200, message: `페이지 정보 읽기 완료`};
}


// 수업 리스트 read
async getStoryes({nowpage, /* search, */ mymode, email}){
    const page = Number(nowpage);
    const perPage = 6;

    // search 페이지 분석 체크 필요
    /*
    const query = {
        $and: [
            // 메인 검색 처리
            ...
    
            // 메인 태그 검색

            // 세부 태그 검색
            ...
        ]
    }
    */

    // 먼저 검색 결과 데이터를 구함 (주석 처리 부분) 최신 생성일 기준으로 정렬함
    let checkStoryes;
    /*
    if(!mymode){
        checkStoryes = await Story.aggregate([
            // 조건에 맞는 게시물 조회
            
            { $match: query },
            

            // Reserve 컬렉션과 조인
            {
                $lookup: {
                    from: 'reserves',        // Reserve 컬렉션의 실제 이름(몽고 compass 확인 시 실제 컬렉션 이름은 소문자 복수형으로 쓰인다)
                    localField: 'nanoid',    // Story의 nanoid 필드
                    foreignField: 'Story_nanoid', // Reserve의 Story_nanoid 필드
                    as: 'reservations'       // 결과 필드 이름을 reservations 로 지어 join 했다.
                }
            },
            // 시간 범위에 맞는 예약 데이터 필터링
            {
                $addFields: {
                    reservations: {
                        $filter: {
                            input: '$reservations',
                            as: 'reservation',
                            cond: {
                                // reserve 의 start_time 가 search 의 endTime 보다 작고,
                                // reserve 의 end_time 가 search 의 startTime 보다 크다. => 의 예약 데이터를 필터링 해야한다.
                                // (start_time === search.endTime 일 수 도 있고
                                //    end_time === search.startTime 일 수도 있다.)
                                $and: [
                                    { $lt: [ { $dateFromString: { dateString: '$$reservation.start_time' } }, new Date(search.endTime) ] },
                                    { $gt: [ { $dateFromString: { dateString: '$$reservation.end_time' } }, new Date(search.startTime) ] }
                                ]
                            }
                        }
                    }
                }
                
            },
            // 예약이 없는 게시물만 필터링
            {
                $match: {
                    reservations: { $eq: [] }
                }
            },
            // 페이지네이션 처리
            { $sort: { createdAt: -1 } },
            { $skip: perPage * (page - 1) },
            { $limit: perPage },
            // Author 정보 조인
            {
                $lookup: {
                    from: 'users',        // User 컬렉션의 이름
                    localField: 'author', // Story의 author 필드
                    foreignField: '_id',  // User의 _id 필드 (관계형 db 에서의 외래키 역할)
                    as: 'authorInfo'      // 결과 필드 이름을 authorInfo 로 지은 후 join
                }
            },
            // Author 정보 필터링 (email, name, nickname, phone, photo만 포함)
            {
                $addFields: {
                    authorInfo: {
                        $map: {
                            input: '$authorInfo',
                            as: 'author', // 최종적으로 author 정보를 내보낼 때는 author 로 내보낸다.
                            in: {
                                email: '$$author.email',
                                name: '$$author.name',
                                phone: '$$author.phone',
                                photo: '$$author.photo'
                            }
                        }
                    }
                }
            },
            // Author 배열이 비어 있지 않으면, 첫 번째 요소를 선택
            {
                $addFields: {
                    authorInfo: { $arrayElemAt: ['$authorInfo', 0] }
                }
            }
        ]);
    } else {
     */
        // 등록 수업 페이지 (자신의 수업는 최대 4개까지만 등록가능하므로 페이지네이션이 필요 없음
        const user = await User.findOne({email});
        checkStoryes = await Post.find({author: user}).sort({createdAt: -1}).populate({
            path: 'author',
            select: "email name phone photo"
        });
    // }
     
    let resultStoryes = checkStoryes;

    return {result: resultStoryes, code: 200, message: `수업 정보 읽기 완료`};
}

// 좋아요 기능 요청 동작 (한번 클릭 시 up, 또 같은 계정으로 같은 글 up 시 up을 취소) (완료)
async upPost({email, nanoid}){
    const author = await User.findOne({email});
    if(!author) { 
        const error = new Error();
        Object.assign(error, {code: 400, message: "유저 정보를 가져오지 못했습니다. 다시 확인해주세요."});
        throw error;
    }
    const Storys = await Story.findOne({nanoid}).populate('author');
    if(!Storys) { 
        const error = new Error();
        Object.assign(error, {code: 400, message: "수업 정보를 가져오지 못했습니다. 다시 확인해주세요."});
        throw error;
    }

    const data = await Like.findOne({user_email: email, class_nanoid: nanoid});
    if(!data) {
        // up 하지 않은 게시물 로 up 데이터 추가
        await Like.create({user_email: email, class_nanoid: nanoid});
        // + up 계산
        const like = Storys.like;
        await Story.updateOne({class_nanoid: nanoid}, {like: like + 1});
        return {code: 200, message: '좋아요를 추가하였습니다!'};
    } else {
        // 이미 up 한 게시물 로 up 데이터 제거
        await Like.deleteOne({user_email: email, class_nanoid: nanoid});
        // - up 계산
        const like = Storys.like;
        await Post.updateOne({class_nanoid: nanoid}, {like: like - 1});
        return {code: 200, message: '좋아요를 삭제하였습니다!'};
    }
}


}

const storyService = new StoryService();
module.exports = storyService;
