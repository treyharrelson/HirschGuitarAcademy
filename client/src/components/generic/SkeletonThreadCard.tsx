function SkeletonThreadCard() {
    return (
        <div className="bg-white rounded-2x1 shadow-sm border border-gray-100 p-5 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
    );
}

export default SkeletonThreadCard;