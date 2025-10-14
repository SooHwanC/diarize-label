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

  useEffect(() => {
    if (!containerRef.current || !audioFile) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#60a5fa',
      progressColor: '#3b82f6',
      cursorColor: '#ef4444',
      barWidth: 2,
      barGap: 1,
      height: 200,
      normalize: true,
      backend: 'WebAudio'
    });

    const regions = wavesurfer.registerPlugin(RegionsPlugin.create());
    regionsPluginRef.current = regions;

    wavesurfer.loadBlob(audioFile);

    wavesurfer.on('ready', () => {
      const audioDuration = wavesurfer.getDuration();
      setDuration(audioDuration);
      
      const container = containerRef.current;
      
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
          
          tempRegionRef.current = regions.addRegion({
            start: start,
            end: end,
            color: 'rgba(156, 163, 175, 0.4)',
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
          
          if (onRegionCreated) {
            const rect = container.getBoundingClientRect();
            const regionCenter = rect.left + ((region.start + region.end) / 2 / audioDuration) * rect.width;
            onRegionCreated(region, {
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
      
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    });

    wavesurfer.on('audioprocess', (time) => {
      setCurrentTime(time);
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));

    regions.on('region-double-clicked', (region) => {
      console.log('[region-double-clicked] Removing:', region.id);
      confirmedRegionsMapRef.current.delete(region.id);
      region.remove();
    });

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [audioFile, containerRef, onRegionCreated]);

  const playPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const stop = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.stop();
      setIsPlaying(false);
    }
  };

  const zoom = (value) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(Number(value));
    }
  };

  const confirmRegion = (speakerId, speakerName, speakerColor) => {
    console.log('[confirmRegion] Start');
    
    if (tempRegionRef.current && regionsPluginRef.current) {
      const tempRegion = tempRegionRef.current;
      const start = tempRegion.start;
      const end = tempRegion.end;
      
      console.log('[confirmRegion] Temp region:', start, '-', end);
      
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
        drag: true,
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
      
      console.log('[confirmRegion] Region confirmed:', regionId);
      console.log('[confirmRegion] Map size:', confirmedRegionsMapRef.current.size);
      console.log('[confirmRegion] Map contents:', Array.from(confirmedRegionsMapRef.current.keys()));
      
      return true;
    }
    
    console.log('[confirmRegion] Failed - no temp region');
    return false;
  };

  const cancelRegion = () => {
    console.log('[cancelRegion] Cancelling temp region');
    if (tempRegionRef.current) {
      tempRegionRef.current.remove();
      tempRegionRef.current = null;
    }
    dragStartRef.current = null;
  };

  const getRegions = () => {
    console.log('[getRegions] Map size:', confirmedRegionsMapRef.current.size);
    
    // Map에서 직접 반환
    const regions = Array.from(confirmedRegionsMapRef.current.values()).map(r => ({
      id: r.id,
      start: r.start,
      end: r.end,
      speakerId: r.speakerId,
      speakerName: r.speakerName
    }));
    
    console.log('[getRegions] Returning regions:', regions.length);
    return regions;
  };

  const clearAllRegions = () => {
    console.log('[clearAllRegions] Clearing all regions');
    
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

  return {
    wavesurfer: wavesurferRef.current,
    regionsPlugin: regionsPluginRef.current,
    isPlaying,
    currentTime,
    duration,
    playPause,
    stop,
    zoom,
    getRegions,
    clearAllRegions,
    getRegionById,
    confirmRegion,
    cancelRegion
  };
};