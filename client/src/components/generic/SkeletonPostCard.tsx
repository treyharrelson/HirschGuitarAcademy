function SkeletonPostCard() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex flex-col gap-1">
                    <div className="h-3 bg-gray-200 rounded w-24" />
                    <div className="h-2 bg-gray-100 rounded w-16" />
                </div>
            </div>
            <div className="h-3 bg-gray-100 rounded w-full mb-2" />
            <div className="h-3 bg-gray-100 rounded w-4/5" />
        </div>
    );
}
export default SkeletonPostCard;