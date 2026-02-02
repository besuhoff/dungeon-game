import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Game } from "../utils/Game";
import { SessionManager } from "../api/SessionManager";
import { AudioManager } from "../utils/AudioManager";
import * as config from "../config";

export const GameScreen: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const gameRef = useRef<Game | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const uiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const initializingRef = useRef(false);
  const [error, setError] = useState("");
  const volumeRef = useRef<HTMLInputElement | null>(null);

  // Memoize manager instances to prevent re-creation on every render
  const sessionManager = useMemo(() => SessionManager.getInstance(), []);
  const audioManager = useMemo(() => AudioManager.getInstance(), []);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted);
  const [volume, setVolume] = useState(audioManager.getMasterVolume());

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      audioManager.setMasterVolume(newVolume);
      setVolume(newVolume);
      if (newVolume === 0) {
        audioManager.mute();
        setIsMuted(true);
      } else {
        if (audioManager.isMuted) {
          audioManager.unmute();
          setIsMuted(false);
        }
      }
      e.target.blur();
    },
    [audioManager],
  );

  useEffect(() => {
    return () => {
      if (gameRef.current) {
        console.log("Stopping game and ending session...");
        sessionManager.endSession().catch((err) => {
          console.error("Error ending session:", err);
        });
        gameRef.current.stop();
        gameRef.current = null;
        initializingRef.current = false;
      }

      document.title = "Dungerra";
    };
  }, []);

  useEffect(() => {
    if (!sessionId) {
      navigate("/sessions");
      return;
    }

    if (
      !gameCanvasRef.current ||
      !lightCanvasRef.current ||
      !uiCanvasRef.current
    ) {
      return;
    }

    // Prevent multiple initializations
    if (initializingRef.current || gameRef.current) {
      return;
    }

    initializingRef.current = true;

    const initGame = async () => {
      try {
        const session = await sessionManager.joinSession(sessionId);
        document.title = `Dungerra - ${session.name}`;

        const game = new Game(
          gameCanvasRef.current!,
          lightCanvasRef.current!,
          uiCanvasRef.current!,
        );
        gameRef.current = game;
        await game.start(session);
      } catch (err) {
        setError("Failed to join session. Redirecting...");
        setTimeout(() => navigate("/sessions"), 2000);
      } finally {
        initializingRef.current = false;
      }
    };

    initGame();

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        console.log("Stopping game and ending session...");
        sessionManager.endSession().catch((err) => {
          console.error("Error ending session:", err);
        });
        gameRef.current.stop();
        gameRef.current = null;
        initializingRef.current = false;
      }

      document.title = "Dungerra";
    };
  }, [sessionId, navigate]);

  if (error) {
    return (
      <div className="screen">
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div id="gameScreen" className="screen">
      <canvas
        ref={gameCanvasRef}
        className="gameCanvas"
        width={config.SCREEN_WIDTH}
        height={config.SCREEN_HEIGHT}
      ></canvas>
      <canvas
        ref={lightCanvasRef}
        className="gameCanvas"
        width={config.SCREEN_WIDTH}
        height={config.SCREEN_HEIGHT}
      ></canvas>
      <canvas
        ref={uiCanvasRef}
        className="gameCanvas"
        width={config.SCREEN_WIDTH}
        height={config.SCREEN_HEIGHT}
      ></canvas>
      <div className="volume-control">
        <label
          className="volume-label"
          onClick={() => {
            if (audioManager.isMuted) {
              audioManager.unmute();
              setIsMuted(false);
              if (volumeRef.current) {
                volumeRef.current.value = audioManager
                  .getMasterVolume()
                  .toString();
              }
            } else {
              audioManager.mute();
              setIsMuted(true);
              if (volumeRef.current) {
                volumeRef.current.value = "0";
              }
            }
          }}
        >
          {isMuted ? "🔇" : "🔊"}
        </label>
        <input
          ref={volumeRef}
          id="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          defaultValue={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
          style={
            {
              "--slider-value": `${isMuted ? 0 : volume * 100}%`,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
};

// Memoize component to prevent re-renders from parent
export default React.memo(GameScreen);
