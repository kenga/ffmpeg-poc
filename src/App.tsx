import { useState, useEffect, useRef } from 'react';
import './App.css';
import { ffmpeg, loadFFmpeg } from './utils/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

function App() {
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [message, setMessage] = useState('Loading ffmpeg-core.js...');
  const [logs, setLogs] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      ffmpeg.on('log', ({ message }) => {
        setLogs((prev) => [...prev, message]);
        console.log(message);
      });
      await loadFFmpeg();
      setReady(true);
      setMessage('FFmpeg loaded');
    } catch (e) {
      console.error(e);
      setMessage('Failed to load FFmpeg: ' + (e as Error).message);
    }
  };

  const extractAudio = async () => {
    if (!video) return;
    setMessage('Extracting audio...');
    try {
      await ffmpeg.writeFile('input.mp4', await fetchFile(video));
      await ffmpeg.exec(['-i', 'input.mp4', 'output.mp3']);
      const data = await ffmpeg.readFile('output.mp3');
      const url = URL.createObjectURL(
        new Blob([data as any], { type: 'audio/mp3' })
      );
      download(url, 'extracted_audio.mp3');
      setMessage('Audio extracted!');
    } catch (e) {
      console.error(e);
      setMessage('Extraction failed');
    }
  };

  const compressAudio = async () => {
    if (!video) return;
    setMessage('Compressing audio...');
    try {
      // Assuming input is audio or video, we compress the audio track
      await ffmpeg.writeFile('input.mp4', await fetchFile(video));
      // Compress to 64k bitrate
      await ffmpeg.exec(['-i', 'input.mp4', '-b:a', '64k', 'compressed.mp3']);
      const data = await ffmpeg.readFile('compressed.mp3');
      const url = URL.createObjectURL(
        new Blob([data as any], { type: 'audio/mp3' })
      );
      download(url, 'compressed.mp3');
      setMessage('Audio compressed!');
    } catch (e) {
      console.error(e);
      setMessage('Compression failed');
    }
  };

  const download = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  return (
    <div className="container">
      <h1>FFmpeg WASM POC</h1>
      {ready ? (
        <div className="tool-box">
          <p>{message}</p>
          <input
            type="file"
            onChange={(e) => setVideo(e.target.files?.item(0) || null)}
          />
          {video && (
            <div className="video-preview">
              <video
                controls
                width="250"
                src={URL.createObjectURL(video)}
                ref={videoRef}
              ></video>
              <div className="actions">
                <button onClick={extractAudio}>Extract Audio (MP3)</button>
                <button onClick={compressAudio}>Compress Audio (64k)</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>Loading FFmpeg... (Check console for details)</p>
      )}
      <div className="logs">
        <h3>Logs</h3>
        <pre>{logs.join('\n')}</pre>
      </div>
    </div>
  );
}

export default App;
