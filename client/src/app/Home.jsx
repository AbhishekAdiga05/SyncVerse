import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidV4 } from "uuid";
import { Code2, LayoutDashboard, History } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [roomId, setRoomId] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetch(`http://localhost:3000/api/workspaces/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setWorkspaces(data.workspaces);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const createNewRoom = async (e) => {
    e.preventDefault();
    const id = uuidV4();
    
    // If the user is signed in, save them as the owner in MongoDB
    if (user) {
      try {
        await fetch("http://localhost:3000/api/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: id, ownerId: user.id })
        });
      } catch (error) {
        console.error("Failed to associate workspace with user");
      }
    }
    
    navigate(`/room/${id}`);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <main className="min-h-screen w-full bg-gray-950 flex flex-col p-4">
      {/* Top Navigation */}
      <nav className="w-full max-w-5xl mx-auto flex justify-between items-center py-4 mb-8">
        <div className="flex items-center gap-2">
          <Code2 className="text-amber-500 w-8 h-8" />
          <h1 className="text-2xl font-bold text-white tracking-tight">CodeWeave</h1>
        </div>
        <div>
          <SignedOut>
            <div className="px-4 py-2 bg-amber-500 text-gray-950 font-bold rounded-lg hover:bg-amber-400 transition cursor-pointer">
              <SignInButton mode="modal" />
            </div>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
          </SignedIn>
        </div>
      </nav>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side: Create / Join */}
        <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to CodeWeave</h2>
          <p className="text-neutral-400 mb-8">Weaving developers, ideas, and code together in real time.</p>

          <form onSubmit={joinRoom} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Enter a Room ID"
              className="w-full p-3 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:outline-none focus:border-amber-500 transition-colors"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button
              type="submit"
              className="w-full p-3 rounded-lg bg-neutral-800 text-white font-semibold hover:bg-neutral-700 transition-colors border border-neutral-700"
            >
              Join Workspace
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-neutral-800"></div>
            <span className="px-4 text-neutral-500 text-sm">OR</span>
            <div className="flex-1 border-t border-neutral-800"></div>
          </div>

          <button
            onClick={createNewRoom}
            className="w-full p-3 rounded-lg bg-amber-500 text-gray-950 font-bold hover:bg-amber-400 transition-colors"
          >
            Create New Workspace
          </button>
        </div>

        {/* Right Side: Dashboard */}
        <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800 shadow-xl flex flex-col h-[500px]">
          <div className="flex items-center gap-2 mb-6">
            <LayoutDashboard className="text-amber-500 w-6 h-6" />
            <h2 className="text-xl font-bold text-white">Your Dashboard</h2>
          </div>
          
          <SignedOut>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <History className="w-12 h-12 text-neutral-600 mb-4" />
              <p className="text-neutral-400">Sign in to automatically save and track your previous coding workspaces.</p>
            </div>
          </SignedOut>

          <SignedIn>
            {loading ? (
              <div className="text-neutral-400 text-center mt-10">Loading workspaces...</div>
            ) : workspaces.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <History className="w-12 h-12 text-neutral-600 mb-4" />
                <p className="text-neutral-400">You haven't created any workspaces yet.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {workspaces.map((ws) => (
                  <div 
                    key={ws._id} 
                    onClick={() => navigate(`/room/${ws.roomId}`)}
                    className="p-4 rounded-lg bg-neutral-800 border border-neutral-700 hover:border-amber-500 cursor-pointer transition flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-semibold text-white">Workspace</h3>
                      <p className="text-xs text-neutral-400 font-mono mt-1">{ws.roomId}</p>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {new Date(ws.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SignedIn>
        </div>

      </div>
    </main>
  );
}
