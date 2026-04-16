const Loading = () => (
  <div className="absolute top-0 left-0 w-dvw flex-center flex-col min-h-dvh gap-y-6 bg-background overflow-hidden">
    <div className="w-24 h-24 rounded-full animate-spin border-6 border-solid border-primary-500 border-t-transparent" />
    <p className="text-gray-800">載入中</p>
  </div>
);

export default Loading;
