// useWaveSurfer.js - 완전히 새로운 접근
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';

export const useWaveSurfer = (containerRef, audioFile, onRegionCreated) => {
  const wavesurferRef = useRef(null);
  const regionsPluginRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef(null);
  const tempRegionRef = useRef(null);
  const confirmedRegionsMapRef = useRef(new Map()); // 확정된 region들을 직접 관리
  const onRegionCreatedRef = useRef(onRegionCreated); // ref로 감싸기
  const eventListenersRef = useRef(null); // 이벤트 리스너 저장
  const [loopingRegionId, setLoopingRegionId] = useState(null); // 반복 재생 중인 구간 ID
  const loopIntervalRef = useRef(null); // 반복 재생 interval
  
  // onRegionCreated 업데이트
  useEffect(() => {
    onRegionCreatedRef.current = onRegionCreated;
  }, [onRegionCreated]);

  useEffect(() => {
    if (!containerRef.current || !audioFile) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#60a5fa',
      progressColor: '#3b82f6',
      cursorColor: '#ef4444',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      height: 200,
      normalize: true,
      backend: 'WebAudio',
      interact: true,
      hideScrollbar: false
    });

    const regions = wavesurfer.registerPlugin(RegionsPlugin.create());
    regionsPluginRef.current = regions;

    wavesurfer.loadBlob(audioFile);

    wavesurfer.on('ready', () => {
      const audioDuration = wavesurfer.getDuration();
      setDuration(audioDuration);
      
      const container = containerRef.current;
      if (!container) return;
      
      const handleMouseDown = (e) => {
        if (e.target.classList.contains('wavesurfer-region') || 
            e.target.closest('.wavesurfer-region')) {
          return;
        }
        
        if (tempRegionRef.current) {
          return;
        }
        
        isDraggingRef.current = true;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = x / rect.width;
        dragStartRef.current = progress * audioDuration;
      };
      
      const handleMouseMove = (e) => {
        if (!isDraggingRef.current || !dragStartRef.current) return;
        if (!regionsPluginRef.current) return; // regions가 있는지 확인
        
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = Math.max(0, Math.min(1, x / rect.width));
        const currentTime = progress * audioDuration;
        
        const start = Math.min(dragStartRef.current, currentTime);
        const end = Math.max(dragStartRef.current, currentTime);
        
        if (end - start > 0.1) {
          if (tempRegionRef.current) {
            tempRegionRef.current.remove();
          }
          
          tempRegionRef.current = regionsPluginRef.current.addRegion({
            start: start,
            end: end,
            color: 'rgba(59, 130, 246, 0.3)',
            drag: false,
            resize: false
          });
        }
      };
      
      const handleMouseUp = (e) => {
        if (!isDraggingRef.current) return;
        
        isDraggingRef.current = false;
        
        if (tempRegionRef.current && tempRegionRef.current.end - tempRegionRef.current.start > 0.1) {
          const region = tempRegionRef.current;
          
          if (onRegionCreatedRef.current && container) {
            const rect = container.getBoundingClientRect();
            const regionCenter = rect.left + ((region.start + region.end) / 2 / audioDuration) * rect.width;
            onRegionCreatedRef.current(region, {
              x: regionCenter,
              y: rect.top
            });
          }
        } else {
          if (tempRegionRef.current) {
            tempRegionRef.current.remove();
            tempRegionRef.current = null;
          }
          dragStartRef.current = null;
        }
      };
      
      // 이벤트 리스너 저장
      eventListenersRef.current = {
        container,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp
      };
      
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseup', handleMouseUp);
    });

    wavesurfer.on('audioprocess', (time) => {
      setCurrentTime(time);
    });

    wavesurfer.on('seek', (progress) => {
      setCurrentTime(progress * wavesurfer.getDuration());
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));

    regions.on('region-double-clicked', (region) => {
      confirmedRegionsMapRef.current.delete(region.id);
      region.remove();
    });

    wavesurferRef.current = wavesurfer;

    return () => {
      // 반복 재생 정리
      if (loopIntervalRef.current && wavesurfer) {
        wavesurfer.un('audioprocess', loopIntervalRef.current);
        loopIntervalRef.current = null;
      }
      setLoopingRegionId(null);
      
      // 재생 중지
      if (wavesurfer) {
        wavesurfer.stop();
      }
      
      // 이벤트 리스너 제거
      if (eventListenersRef.current) {
        const { container, handleMouseDown, handleMouseMove, handleMouseUp } = eventListenersRef.current;
        if (container) {
          container.removeEventListener('mousedown', handleMouseDown);
          container.removeEventListener('mousemove', handleMouseMove);
          container.removeEventListener('mouseup', handleMouseUp);
        }
        document.removeEventListener('mouseup', handleMouseUp);
        eventListenersRef.current = null;
      }
      
      // WaveSurfer 인스턴스 제거
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
  }, [audioFile]);

  const playPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const stop = () => {
    if (wavesurferRef.current) {
      // 반복 재생 중지
      stopRegionLoop();
      // 재생 중지
      wavesurferRef.current.stop();
      // 재생 위치를 처음으로
      wavesurferRef.current.seekTo(0);
      setIsPlaying(false);
    }
  };

  const zoom = (value) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(Number(value));
    }
  };

  const confirmRegion = (speakerId, speakerName, speakerColor) => {
    if (tempRegionRef.current && regionsPluginRef.current) {
      const tempRegion = tempRegionRef.current;
      const start = tempRegion.start;
      const end = tempRegion.end;
      
      // 임시 region 제거
      tempRegion.remove();
      tempRegionRef.current = null;
      
      // 고유 ID 생성
      const regionId = `region-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 새로운 확정 region 생성
      const confirmedRegion = regionsPluginRef.current.addRegion({
        id: regionId,
        start: start,
        end: end,
        color: speakerColor + '80',
        drag: false,
        resize: true
      });
      
      // 화자 정보 추가
      confirmedRegion.speakerId = speakerId;
      confirmedRegion.speakerName = speakerName;
      
      // Map에 저장
      confirmedRegionsMapRef.current.set(regionId, {
        id: regionId,
        start: start,
        end: end,
        speakerId: speakerId,
        speakerName: speakerName,
        regionObject: confirmedRegion
      });
      
      return true;
    }
    
    return false;
  };

  const cancelRegion = () => {
    if (tempRegionRef.current) {
      tempRegionRef.current.remove();
      tempRegionRef.current = null;
    }
    dragStartRef.current = null;
  };

  const getRegions = () => {
    // Map에서 직접 반환
    const regions = Array.from(confirmedRegionsMapRef.current.values()).map(r => ({
      id: r.id,
      start: r.start,
      end: r.end,
      speakerId: r.speakerId,
      speakerName: r.speakerName
    }));
    
    return regions;
  };

  const clearAllRegions = () => {
    // Map의 모든 region 제거
    confirmedRegionsMapRef.current.forEach(r => {
      if (r.regionObject) {
        r.regionObject.remove();
      }
    });
    
    confirmedRegionsMapRef.current.clear();
    tempRegionRef.current = null;
    
    if (regionsPluginRef.current) {
      regionsPluginRef.current.clearRegions();
    }
  };

  const getRegionById = (id) => {
    const regionData = confirmedRegionsMapRef.current.get(id);
    return regionData ? regionData.regionObject : null;
  };

  // 기존 구간 데이터 불러오기
  const loadRegions = (regionsData, speakersMap) => {
    if (!regionsPluginRef.current) return;

    // 기존 구간 모두 제거
    clearAllRegions();

    // 새 구간 추가
    regionsData.forEach(regionData => {
      const speaker = speakersMap.get(regionData.speakerId);
      if (!speaker) return; // 화자가 없으면 스킵

      const regionId = regionData.id || `region-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const confirmedRegion = regionsPluginRef.current.addRegion({
        id: regionId,
        start: regionData.start,
        end: regionData.end,
        color: speaker.color + '80',
        drag: false,
        resize: true
      });

      // 화자 정보 추가
      confirmedRegion.speakerId = speaker.id;
      confirmedRegion.speakerName = speaker.name;

      // Map에 저장
      confirmedRegionsMapRef.current.set(regionId, {
        id: regionId,
        start: regionData.start,
        end: regionData.end,
        speakerId: speaker.id,
        speakerName: speaker.name,
        regionObject: confirmedRegion
      });
    });
  };

  const playRegionLoop = (regionId) => {
    const regionData = confirmedRegionsMapRef.current.get(regionId);
    if (!regionData || !wavesurferRef.current) return;

    // 기존 반복 정지
    stopRegionLoop();

    const { start, end } = regionData;
    
    // 구간 시작 위치로 이동하고 재생
    wavesurferRef.current.seekTo(start / duration);
    wavesurferRef.current.play();
    setLoopingRegionId(regionId);

    // audioprocess 이벤트로 반복 체크
    const handleAudioProcess = (time) => {
      if (time >= end) {
        wavesurferRef.current.seekTo(start / duration);
      }
    };

    wavesurferRef.current.on('audioprocess', handleAudioProcess);
    
    // cleanup을 위해 저장
    loopIntervalRef.current = handleAudioProcess;
  };

  const stopRegionLoop = () => {
    if (loopIntervalRef.current && wavesurferRef.current) {
      wavesurferRef.current.un('audioprocess', loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
    // 반복 재생 중지 시 오디오도 일시정지
    if (wavesurferRef.current && wavesurferRef.current.isPlaying()) {
      wavesurferRef.current.pause();
    }
    setLoopingRegionId(null);
  };

  const playPauseWithLoopStop = () => {
    // 반복 재생 중이면 중지
    if (loopingRegionId) {
      stopRegionLoop();
    }
    playPause();
  };

  return {
    wavesurfer: wavesurferRef.current,
    regionsPlugin: regionsPluginRef.current,
    isPlaying,
    currentTime,
    duration,
    playPause: playPauseWithLoopStop,
    stop,
    zoom,
    getRegions,
    clearAllRegions,
    getRegionById,
    confirmRegion,
    cancelRegion,
    playRegionLoop,
    stopRegionLoop,
    loopingRegionId,
    loadRegions
  };
};