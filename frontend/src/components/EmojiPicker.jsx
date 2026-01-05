import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Smile } from 'lucide-react';

const EMOJI_CATEGORIES = {
  "😊 Smileys": ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😎", "🤩", "🥳", "😏", "🤔", "🤗"],
  "🎉 Fêtes": ["🎄", "🎅", "🤶", "🎁", "🎊", "🎉", "✨", "🎆", "🎇", "🧨", "🎃", "👻", "🎭", "🎪", "🎯", "🎲", "🏆", "🥇", "🎖️", "🏅"],
  "🚗 Véhicules": ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", "⛽", "🔧"],
  "⚡ Symboles": ["⚡", "🔥", "💥", "💫", "⭐", "🌟", "✨", "💯", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💰", "💎", "🏷️", "📌"],
  "🌿 Nature": ["🌸", "🌺", "🌻", "🌹", "🌷", "🍀", "🍂", "🍁", "❄️", "☀️", "🌈", "⛅", "🌙", "⭐", "🌊", "🔥", "💧", "🌍", "🌲", "🌴"],
  "👍 Gestes": ["👍", "👎", "👌", "✌️", "🤞", "🤝", "👏", "🙌", "💪", "🎯", "✅", "❌", "⚠️", "📢", "🔔", "💬", "📧", "📞", "🛒", "💳"]
};

export default function EmojiPicker({ onSelect, className = "" }) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(Object.keys(EMOJI_CATEGORIES)[0]);

  const handleSelect = (emoji) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          className={`h-9 px-2 ${className}`}
        >
          <Smile className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-2 py-1 text-sm rounded transition-colors ${
                activeCategory === category 
                  ? 'bg-accent text-white' 
                  : 'hover:bg-secondary'
              }`}
            >
              {category.split(' ')[0]}
            </button>
          ))}
        </div>
        
        {/* Emoji Grid */}
        <div className="grid grid-cols-10 gap-1">
          {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleSelect(emoji)}
              className="w-7 h-7 flex items-center justify-center text-lg hover:bg-secondary rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Cliquez pour insérer
        </p>
      </PopoverContent>
    </Popover>
  );
}
