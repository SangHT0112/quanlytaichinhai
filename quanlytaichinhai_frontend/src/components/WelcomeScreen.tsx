import QuickActions from '@/components/QuickActions';

interface WelcomeScreenProps {
  userId: number;
  onQuickAction: (action: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ userId, onQuickAction }) => {
  return (
    <div className="fixed inset-0 flex justify-center items-center pointer-events-none">
      <div className="flex flex-col items-center w-full max-w-3xl px-4 pointer-events-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent mb-4 leading-tight drop-shadow-lg">
            Quản Lý Tài Chính AI
          </h1>
          <p className="text-xl text-slate-200 mb-6 leading-relaxed max-w-2xl mx-auto">
            Hệ thống quản lý tài chính thông minh với trí tuệ nhân tạo
          </p>
        </div>
        
        <div className="mt-6">
          <QuickActions
            userId={userId}
            onAction={onQuickAction}
          />
        </div>
      </div>
    </div>
  );
};