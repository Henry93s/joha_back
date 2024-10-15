const {User, Class, Reserve} = require('../models');
const isDateDifferenceFrom2Days = require('../utils/isDateDifferenceFrom2Days');

class ReserveService {
    // 수업 리스트 페이지 정보 read (mymode === true : 나의수업, false : 수강자관리)
    async getReservePage({mymode, user, host_email}){
      // 첫 페이지 진입이므로 1 고정
      const page = 1;
      const perPage = 6;

      const query = {
        // 추가 쿼리 필요시 적용
      };
      
      // 사용자가 mymode 를 체크하여 검색할 쿼리(author OR host_email) 을 정함
      let checkReserves;
      if(mymode){ // 나의 수업
        checkReserves = await Reserve.find({author: user/*, ...query*/});
      } else { // 수강자 관리
        checkReserves = await Reserve.find({host_email/*, ...query*/});
      }

      // pastResult
      const pastResult = {
        page: page,
        perPage: perPage,
        total: checkReserves.length,
        totalPage: Math.ceil(checkReserves.length/perPage)
      };

      return {result: pastResult, code: 200, message: `reserve 페이지 정보 읽기 완료`};
    }

    // 수업 리스트 read (mymode === true : 나의수업, false : 수강자관리)
    async getReservePageRead({nowpage, mymode, user, host_email}){
      const page = Number(nowpage);
      const perPage = 6;

      const query = {
        // 추가 쿼리 필요시 적용
      };
      
      // 사용자가 mymode 를 체크하여 검색할 쿼리(author OR host_email) 을 정함
      let checkReserves;
      // 나의 수업
      if(mymode){
        checkReserves = await Reserve.find({author: user/*, ...query*/}).sort({createdAt: -1}).skip(perPage * (page - 1))
          .limit(perPage).populate({
              path: 'author',
              select: "email name phone photo"
          });
      } else { // 수강자 관리
        checkReserves = await Reserve.find({host_email/*, ...query*/}).sort({createdAt: -1}).skip(perPage * (page - 1))
          .limit(perPage).populate({
              path: 'author',
              select: "email name phone photo"
          });
      }

      return {result: checkReserves, code: 200, message: `수업(예약) 리스트 정보 읽기 완료`};
    }

    // 수업(or 예약) 상세 보기 정보
    async getReserveDetail({nanoid}){
      const reserve = await Reserve.findOne({nanoid}).populate({
          path: 'author',
          select: "email name phone photo"
      });
      if(!reserve){
          const error = new Error();
          Object.assign(error, {code: 400, message: "수업(예약) 정보를 가져오지 못했습니다. 다시 확인해주세요."});
          throw error;
      }
      return {data: reserve, code: 200, message: '수업(예약) 상세 정보 읽기 완료'};
  }

    // 예약(수업) 추가 writeReserve
    async writeReserve(bodyData){
      // nanoid 는 bodyData 에 class_nanoid 이름으로 들어올 것
      // title 도 class 에서 title 그대로 가져올 것
      const author = await User.findOne({email: bodyData.email}, "email name phone photo");
      const classs = await Class.findOne({nanoid: bodyData.class_nanoid}).populate('author');
        const data = await Reserve.create({
            author: author,
            class_nanoid: bodyData.class_nanoid,
            title: classs.title,
            host_name: classs.author.name,
            host_email: classs.author.email,
            host_phone: classs.author.phone,
            main_image: classs.main_image,
            sub_images: classs.sub_images,
            main_location: classs.main_location,
            sub_location: classs.sub_location,
            amount: Number(bodyData.amount),
            start_time: bodyData.start_time,
            end_time: bodyData.end_time
        });
        return {data: data, code: 200, message: `수업(예약) 등록 완료`};
    }

    // 예약(수업) 삭제
    async deleteReserve({nanoid}){
        const reserve = await Reserve.findOne({nanoid}).populate('author');
        if(!reserve) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "수업(예약) 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        await Reserve.deleteOne({nanoid});
        return {code: 200, message: `수업(예약) 삭제 완료`};
    }
}

const reserveService = new ReserveService();
module.exports = reserveService;