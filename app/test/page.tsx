'use client'
import { useState } from 'react'
// 아까 우리가 만든 썬더볼트 케이블을 불러오는 거야!
import { supabase } from '@/lib/supabase'

export default function TestPage() {
  const [status, setStatus] = useState('대기 중... 🎬')

  // 이 함수가 바로 수파베이스로 데이터를 쏘는 '렌더링 버튼' 역할이야!
  const shootData = async () => {
    setStatus('전송 중... 로딩 바 올라가는 중! 🚀')
    
    // insert() 안에 있는 내용이 수파베이스 트랙(Column)에 꽂힐 소스들이야
    const { error } = await supabase
      .from('saju_requests')
      .insert([
        {
          name: '김플럭스',
          gender: '남자',
          birth_date: '1985-02-20',
          calendar_type: '양력',
          birth_time: '06:30',
          status: '결제대기'
        }
      ])

    if (error) {
      console.error(error)
      setStatus('에러 발생! 케이블 점검 필요 🚨')
    } else {
      setStatus('전송 성공! 컷! 수파베이스 금고 확인해봐! 🎉')
    }
  }

  return (
    <div className="p-10 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-5 text-yellow-400">🎬 수파베이스 다이내믹 링크 테스트</h1>
      <p className="mb-8 text-gray-300">아래 버튼을 누르면 DB로 '김플럭스' 데이터가 날아갑니다.</p>
      
      <button
        onClick={shootData}
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-lg transition-all"
      >
        테스트 사주 데이터 쏘기 슛!
      </button>
      
      <p className="mt-6 font-bold text-xl text-green-400">상태 모니터: {status}</p>
    </div>
  )
}