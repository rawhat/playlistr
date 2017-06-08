defmodule Playlistr.Song do
    def init(info, isVideo, url, length, streamUrl) do
        %{
            "info" => info, 
            "isVideo" => isVideo, 
            "url" => url, 
            "length" => length, 
            "streamUrl" => streamUrl
        }
    end
end