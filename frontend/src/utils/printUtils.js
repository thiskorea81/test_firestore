/**
 * 날짜 포맷팅 헬퍼
 */
const formatDate = (t) => {
  if (!t) return '';
  const d = t.toDate ? t.toDate() : new Date(t);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

const isChk = (val, target) => val === target ? '&#9745;' : '&#9744;';
const isChkBool = (condition) => condition ? '&#9745;' : '&#9744;';

/**
 * 결재란 HTML 생성
 */
const getSanctionHTML = (approvalLine, doc) => {
  let header = '';
  let body = '';
  
  if (approvalLine && approvalLine.length > 0) {
    approvalLine.forEach((step, idx) => {
      header += `<th class="sanction-role">${step.label}</th>`;
      let content = '';
      if (step.isFinal) {
        content = '<span class="proxy-mark">전결</span>';
      }
      body += `<td class="stamp-box">${content}</td>`;
    });
  }
  return { header, body };
};

/**
 * [양식 1] 결석신고서 HTML
 */
const getAbsenceFormHTML = (doc, teacherData, approvalLine) => {
  const dateStr = formatDate(doc.submittedAt);
  const procDateStr = formatDate(doc.processedAt || new Date());
  const sanction = getSanctionHTML(approvalLine, doc);
  const methodDetail = doc.teacherCheck?.method === '기타' ? `(${doc.teacherCheck.methodDetail})` : '';

  const type = doc.absenceType || '';
  const isDisease = type === '질병결석';
  const isMenstrual = type === '인정결석(생리통)';
  const isOther = type === '기타결석';
  const isEvent = type === '경조사'; 
  const isService = type === '사회봉사';
  const isInfection = type === '법정감염병';

  return `
    <div class="page">
      <div class="top-header-area">
        <h1 class="main-title-left">결 석 신 고 서</h1>
        <div class="sanction-wrapper">
          <table class="sanction-table">
            <tbody>
              <tr><th rowspan="2" class="sanction-title">결<br>재</th>${sanction.header}</tr>
              <tr>${sanction.body}</tr>
            </tbody>
          </table>
        </div>
      </div>

      <table class="main-table">
        <colgroup><col width="15%"><col width="35%"><col width="15%"><col width="35%"></colgroup>
        <tbody>
          <tr>
            <th>학년 / 반</th><td>${doc.grade}학년 ${doc.class}반 ${doc.number}번</td>
            <th>성 명</th><td>${doc.studentName}</td>
          </tr>
          <tr>
            <th>결석 기간</th>
            <td colspan="3">
              ${doc.period?.start} ~ ${doc.period?.end} (총 ${doc.period?.days}일간)<br>
              ${doc.period?.startPeriod ? `(${doc.period.startPeriod}교시 ~ ${doc.period.endPeriod}교시)` : ''}
            </td>
          </tr>
          
          <tr>
            <th style="padding:0; vertical-align:middle;">유 형<br><span style="font-size:11px; font-weight:normal;">(해당란 V표)</span></th>
            <td colspan="3" style="padding:0;">
              <table style="width:100%; height:100%; border-collapse:collapse; border:none; margin:0;">
                <colgroup>
                   <col width="16.66%"> <col width="16.66%"> 
                   <col width="16.66%"> <col width="16.66%"> <col width="16.66%"> <col width="16.66%">
                </colgroup>
                
                <tr>
                  <td rowspan="2" class="sub-header-cell" style="border-top:0; border-bottom:0; border-left:0;">질병</td>
                  <td rowspan="2" class="sub-header-cell" style="border-top:0; border-bottom:0;">기타</td>
                  <td colspan="4" class="sub-header-cell" style="border-top:0; border-right:0; border-bottom:1px solid black;">출석인정</td>
                </tr>
                
                <tr>
                  <td class="sub-header-cell-sm" style="border-bottom:1px solid black;">경조사</td>
                  <td class="sub-header-cell-sm" style="border-bottom:1px solid black;">사회봉사<br>특별교육</td>
                  <td class="sub-header-cell-sm" style="border-bottom:1px solid black;">법정<br>감염병</td>
                  <td class="sub-header-cell-sm" style="border-bottom:1px solid black; border-right:0;">기타<br>(생리 등)</td>
                </tr>

                <tr style="height:40px;">
                  <td class="check-cell-box" style="border-bottom:0; border-left:0;">${isChkBool(isDisease)}</td>
                  <td class="check-cell-box" style="border-bottom:0;">${isChkBool(isOther)}</td>
                  <td class="check-cell-box" style="border-bottom:0;">${isChkBool(isEvent)}</td>
                  <td class="check-cell-box" style="border-bottom:0;">${isChkBool(isService)}</td>
                  <td class="check-cell-box" style="border-bottom:0;">${isChkBool(isInfection)}</td>
                  <td class="check-cell-box" style="border-bottom:0; border-right:0;">${isChkBool(isMenstrual)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <th class="h-24">사 유 및<br>학부모 의견</th>
            <td colspan="3" class="align-top py-2" style="line-height:1.6;">
              <strong>[사유]</strong> ${doc.reason}<br><br>
              <strong>[학부모 의견]</strong> ${doc.parentOpinion || '(없음)'}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="signature-section">
        <div class="declaration">
          상기 본인은 위와 같은 사유로 (${doc.absenceDetail || '결석'}) 하였기에<br>
          증빙서류와 함께 보호자 연서로 확인서를 제출합니다.
        </div>
        <div class="date-center" style="margin-bottom:20px;">${dateStr}</div>
        <div class="signatures">
          <div class="sig-row"><span class="role">학 생 :</span><span class="name">${doc.studentName}</span>${doc.signatures?.studentSig ? `<img src="${doc.signatures.studentSig}" class="sig-img-sm"/>`:'(인)'}</div>
          <div class="sig-row"><span class="role">보호자 :</span><span class="name">${doc.signatures?.parentName}</span>${doc.signatures?.parentSig ? `<img src="${doc.signatures.parentSig}" class="sig-img-sm"/>`:'(인)'}</div>
        </div>
      </div>

      <hr class="divider"/>

      <h1 class="sub-title-left">『담임확인서』</h1>
      <table class="main-table">
        <colgroup><col width="20%"><col width="80%"></colgroup>
        <tbody>
          <tr>
            <th>담임확인 및<br>증빙 서류</th>
            <td>
              <div class="check-row mb-2">
                <span class="check-item">${isChk(doc.teacherCheck?.method, '통화')} 보호자와 통화 확인</span>
                <span class="check-item">${isChk(doc.teacherCheck?.method, '면담')} 보호자 면담</span>
                <span class="check-item">${isChk(doc.teacherCheck?.method, '기타')} 기타 ${methodDetail}</span>
              </div>
              <div class="check-grid-2">
                <span>${isChk(doc.teacherCheck?.proofType, '병원진료영수증')} 병원진료영수증</span>
                <span>${isChk(doc.teacherCheck?.proofType, '투약봉지')} 투약봉지</span>
                <span>${isChk(doc.teacherCheck?.proofType, '병원처방전')} 병원처방전</span>
                <span>${isChk(doc.teacherCheck?.proofType, '의료기관 진단서/소견서')} 의료기관의 진단서(소견서)</span>
                <span>${isChk(doc.teacherCheck?.proofType, 'PCR 결과 통보서')} PCR 결과 통보서</span>
                <span>${isChk(doc.teacherCheck?.proofType, '증빙서류 없음')} 증빙서류 없음</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="signature-section" style="margin-top:30px;">
        <div class="declaration" style="font-weight:normal;">"해당 학생이 위와 같은 사유로 (${doc.absenceDetail || '결석'}) 하였음을 확인합니다."</div>
        <div class="date-center" style="margin-top:10px; margin-bottom:20px;">${procDateStr}</div>
        <div class="signatures" style="justify-content:flex-end;">
          <div class="sig-row"><span class="role">담임교사 :</span><span class="name">${teacherData.name}</span>${doc.teacherSignature ? `<img src="${doc.teacherSignature}" class="sig-img-sm"/>`:'(인)'}</div>
        </div>
        <div class="school-master">상당고등학교장 귀하</div>
        
        <div class="footer-info">
          ※ 결석 신고서는 결석한 날로부터 5일 이내에 증빙서류를 첨부하여 제출한다.<br>
          ※ 증빙서류<br>
          &nbsp; 1. 질병결석 : 2일 이내 - 학부모 의견서, 처방전, 담임확인서 등이 첨부된 결석 신고서<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3일 이상 - 의사소견서 또는 진단서 등이 첨부된 결석 신고서<br>
          &nbsp; 2. 기타결석 : 가정 사정에 의한 부득이한 결석 - 관련 증빙서류 (간병, 이사, 부모 및 가족 봉양 등)<br>
          &nbsp; 3. 인정결석 : 청첩장, 가족관계증명서, 사망진단서 등 (생리결석은 학부모 의견 및 담임확인서로 갈음)
        </div>
      </div>
    </div>
  `;
};

const getTripAppHTML = () => `<div class="page"><h1>현장체험학습 신청서 (준비중)</h1></div>`;

export const printDocument = (doc, teacherData, approvalLine) => {
  let contentHTML = doc.type === '결석신고서' ? getAbsenceFormHTML(doc, teacherData, approvalLine) : getTripAppHTML(doc);
  const win = window.open('', '_blank', 'width=900,height=1200');
  
  win.document.write(`
    <html>
      <head>
        <title>${doc.type} 인쇄</title>
        <style>
          @page { size: A4; margin: 0; }
          body { font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; margin: 0; padding: 0; background: #52525b; }
          .page { background: white; width: 210mm; height: 296mm; padding: 15mm 20mm; margin: 0 auto; box-sizing: border-box; overflow: hidden; position: relative; }
          
          /* [수정] 헤더 레이아웃 (반반, 수직중앙정렬) */
          .top-header-area { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; width: 100%; }
          
          /* [수정] 제목 스타일 (바탕체, 33px, 자간 5px) */
          .main-title-left { 
            width: 50%; 
            font-family: "바탕", "Batang", serif;
            font-size: 33px; font-weight: bold; text-decoration: underline; margin: 0; 
            letter-spacing: 5px; text-underline-offset: 8px; text-align: center; 
          }
          .sub-title-left { font-size: 20px; font-weight: bold; margin-bottom: 10px; margin-top: 10px; }
          
          .sanction-wrapper { width: 50%; display: flex; justify-content: flex-end; }
          .sanction-table { border-collapse: collapse; font-size: 11px; text-align: center; }
          .sanction-table th, .sanction-table td { border: 1px solid black; padding: 0; vertical-align: middle; }
          .sanction-title { width: 25px; background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          .sanction-role { width: 65px; height: 25px; font-weight: normal; }
          .stamp-box { height: 55px; width: 65px; text-align: center; }
          .proxy-mark { font-weight: bold; font-family: serif; letter-spacing: 2px; }
          .stamp-img { max-width: 55px; max-height: 45px; object-fit: contain; }

          .main-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 10px; }
          .main-table th, .main-table td { border: 1px solid black; padding: 6px 8px; vertical-align: middle; }
          .main-table th { background-color: #f3f4f6 !important; text-align: center; font-weight: bold; -webkit-print-color-adjust: exact; }
          .check-cell-row span { margin-right: 15px; font-weight: bold; }
          .check-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; margin-top: 5px; }
          .check-row { display: flex; gap: 15px; }
          
          /* 중첩 테이블 스타일 */
          .sub-header-cell { background-color: #f3f4f6 !important; text-align: center; font-weight: bold; border-right: 1px solid black; -webkit-print-color-adjust: exact; }
          .sub-header-cell-sm { background-color: #f3f4f6 !important; text-align: center; font-size: 11px; border-right: 1px solid black; border-bottom: 1px solid black; -webkit-print-color-adjust: exact; }
          .check-cell-box { text-align: center; font-size: 16px; border-right: 1px solid black; }
          .check-cell-box:last-child { border-right: none; }

          .bg-gray-100 { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          .signature-section { text-align: center; margin-top: 10px; }
          .declaration { font-size: 15px; margin-bottom: 10px; line-height: 1.5; }
          .date-center { font-size: 15px; margin-bottom: 15px; }
          .signatures { display: flex; justify-content: center; gap: 50px; }
          .sig-row { display: flex; align-items: center; font-size: 15px; }
          .role { font-weight: bold; margin-right: 10px; }
          .name { font-weight: bold; text-decoration: underline; margin-right: 5px; font-size: 16px; }
          .sig-img-sm { height: 35px; }
          .school-master { font-size: 22px; font-weight: bold; margin-top: 20px; text-align: center; letter-spacing: 2px; }
          
          .footer-info { text-align: left; font-size: 11px; color: #555; line-height: 1.5; border-top: 2px solid #ddd; padding-top: 10px; margin-top: 20px; }
          hr.divider { border: 0; border-top: 1px dashed #aaa; margin: 25px 0; }
          @media print { body { background: none; } .page { margin: 0; width: 100%; height: 100%; box-shadow: none; } }
        </style>
      </head>
      <body>${contentHTML}<script>window.onload = function(){ setTimeout(()=>{ window.print(); }, 500); }<\/script></body>
    </html>
  `);
  win.document.close();
};