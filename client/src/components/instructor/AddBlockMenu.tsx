interface AddBlockProps {
  onAdd: (type: 'text' | 'image' | 'video') => void;
}

const AddBlockMenu: React.FC<AddBlockProps> = ({ onAdd }) => {
  return (
    <div className="flex items-center justify-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors my-4 group">
      <span className="text-gray-400 group-hover:text-gray-600 font-medium">Add content:</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onAdd('text')}
          className="flex items-center gap-1 px-3 py-1.5 bg-white border rounded shadow-sm hover:border-blue-500 text-sm"
        >
          <span className="text-blue-500 font-bold">T</span> Text
        </button>
        <button
          type="button"
          onClick={() => onAdd('image')}
          className="flex items-center gap-1 px-3 py-1.5 bg-white border rounded shadow-sm hover:border-green-500 text-sm"
        >
          🖼️ Image
        </button>
        <button
          type="button"
          onClick={() => onAdd('video')}
          className="flex items-center gap-1 px-3 py-1.5 bg-white border rounded shadow-sm hover:border-red-500 text-sm"
        >
          🎥 Video
        </button>
      </div>
    </div>
  );
};
export default AddBlockMenu;