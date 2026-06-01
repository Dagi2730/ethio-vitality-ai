import { useCallback, useEffect, useRef, useState } from "react";

function getRecognitionCtor(): (new () => SpeechRecognition) | null {
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeech(lang: "en" | "am") {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setSupported(!!getRecognitionCtor() && "speechSynthesis" in window);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(
    (onResult: (text: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return;

      const recognition = new Ctor();
      recognition.lang = lang === "am" ? "am-ET" : "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        if (transcript) onResult(transcript);
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
      setListening(true);
      recognition.start();
    },
    [lang]
  );

  const speak = useCallback((text: string, utteranceLang?: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = utteranceLang === "am" ? "am-ET" : "en-US";
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return {
    supported,
    listening,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
