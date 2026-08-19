import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Car, 
  Compass, 
  HelpCircle, 
  CheckCircle2, 
  Wrench, 
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { SHOP_LOCATION_INFO } from '../data/servicesData';

export const AITyreAdvisor: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ role: 'assistant' | 'user'; text: string; isFallback?: boolean }>>([
    {
      role: 'assistant',
      text: `Hello! I am your **Max Executive Tires & Dominica Road Advisor** at Maranatha Square, Pichelin. 
Dominica's steep hills, sharp hairpin corners, and tropical rain require the right tyres and proper air pressure. 
Tell me what vehicle you drive or what roads you travel (e.g. Pichelin Hill, Grand Bay, Roseau commute), and I'll recommend the ideal new or inspected used tyre!`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    "What tyre is best for driving up Pichelin hill in heavy rain with a Toyota RAV4?",
    "Is an 85% tread tested used tyre safe for a Toyota Hilux carrying loads?",
    "Why are the outer edges of my front tyres wearing out so fast in Dominica?",
    "What PSI should I keep for Toyota Noah taxi running Roseau to Grand Bay?",
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, text: query }];
    setMessages(newMessages);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/tyre-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          vehicleInfo: vehicleInfo || 'Dominica Passenger / 4x4 / Taxi',
          drivingHabits: 'Dominica mountain inclines, rain, curves',
        }),
      });

      if (!response.ok) throw new Error('Network error');
      const data = await response.json();

      setMessages([...newMessages, { role: 'assistant', text: data.reply, isFallback: data.isFallback }]);
    } catch (err) {
      // Fallback local advice
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: `At Max Executive Tires in Maranatha Square, Pichelin, we recommend 4x4 A/T or reinforced XL passenger tyres for Dominica's steep climbs. Regular 4-wheel rotation every 5,000 km is critical on our mountain roads to stop uneven shoulder scrub! Stop by our workshop in Pichelin for a free pressure and tread gauge check.`,
          isFallback: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ai-advisor-section" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-[#0984E3] border border-blue-200/60 text-xs font-bold uppercase px-3 py-1 rounded-md mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#0984E3]" />
            Dominica Mountain & Tyre AI Advisor
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3436] tracking-tight">
            Ask our Pichelin Master Tyre Technician
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Get personalized advice on tyre size, wet grip, tread depth safety, and pothole resistance for Dominica roads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Your vehicle (e.g. Hilux, RAV4, Noah)"
            value={vehicleInfo}
            onChange={(e) => setVehicleInfo(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#0984E3]"
          />
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
          Popular Questions by Dominica Drivers:
        </label>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-left text-xs bg-slate-50 hover:bg-blue-50 hover:text-[#0984E3] hover:border-blue-200 border border-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg transition"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="bg-slate-50 rounded-xl p-4 sm:p-6 border border-slate-200 space-y-4 max-h-[450px] overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-xl p-4 text-xs sm:text-sm leading-relaxed space-y-2 ${
                msg.role === 'user'
                  ? 'bg-[#0984E3] text-white font-medium rounded-br-none shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0984E3] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-slate-500 text-xs font-semibold">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center animate-spin">
              <RefreshCw className="w-4 h-4" />
            </div>
            <span>Consulting Dominica tyre database...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask anything about tyres, PSI, or Dominica road conditions..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#0984E3] focus:border-[#0984E3]"
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold px-5 py-2.5 rounded-lg transition flex items-center gap-2 disabled:opacity-40 shadow-xs"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </form>
    </section>
  );
};
