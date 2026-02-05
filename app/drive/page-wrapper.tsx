
export default function DrivePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <DrivePageContent />
        </Suspense>
    );
}
