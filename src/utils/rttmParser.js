// RTTM 파일 파싱 유틸리티

/**
 * RTTM 파일 내용을 파싱하여 구간 정보 추출
 * RTTM 형식: SPEAKER <filename> 1 <start> <duration> <NA> <NA> <speaker_id> <NA> <NA>
 */
export const parseRTTM = (rttmContent) => {
  if (!rttmContent || typeof rttmContent !== 'string') {
    return [];
  }

  const regions = [];
  const lines = rttmContent.trim().split('\n');

  for (const line of lines) {
    if (!line.trim() || line.startsWith('#')) continue;

    const parts = line.trim().split(/\s+/);
    
    if (parts.length >= 8 && parts[0] === 'SPEAKER') {
      const start = parseFloat(parts[3]);
      const duration = parseFloat(parts[4]);
      const speakerId = parts[7];

      if (!isNaN(start) && !isNaN(duration)) {
        regions.push({
          start: start,
          end: start + duration,
          speakerId: speakerId,
          speakerName: speakerId // 일단 ID를 이름으로 사용, 나중에 매핑
        });
      }
    }
  }

  return regions;
};

/**
 * 화자 ID를 실제 화자 정보와 매핑
 */
export const mapSpeakersToRegions = (regions, speakers) => {
  return regions.map(region => {
    const speaker = speakers.find(s => s.id === region.speakerId);
    return {
      ...region,
      speakerName: speaker?.name || region.speakerId,
      // 구간 ID는 새로 생성
      id: `region-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  });
};

/**
 * RTTM 파일에서 사용된 화자 ID 목록 추출
 */
export const extractSpeakerIds = (rttmContent) => {
  const regions = parseRTTM(rttmContent);
  const speakerIds = new Set();
  
  regions.forEach(region => {
    speakerIds.add(region.speakerId);
  });
  
  return Array.from(speakerIds);
};

