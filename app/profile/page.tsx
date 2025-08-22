export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Student Profile</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <p className="text-gray-900">Student Name</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">student@university.edu</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                University
              </label>
              <p className="text-gray-900">University of Technology</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program
              </label>
              <p className="text-gray-900">Computer Science</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Year
              </label>
              <p className="text-gray-900">3rd Year</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GPA
              </label>
              <p className="text-gray-900">3.8</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
