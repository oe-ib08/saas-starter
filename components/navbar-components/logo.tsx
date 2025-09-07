export default function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">S</span>
      </div>
      <span className="font-bold text-xl text-gray-900 dark:text-white">
        SaaS Starter
      </span>
    </div>
  );
}
