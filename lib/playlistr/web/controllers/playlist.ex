defmodule Playlistr.Playlist do
    def init(title, category, password, open_submissions, type, creator) do
        %{
            :title => title,
            :category => category,
            :password => password,
            :open_submissions => open_submissions,
            :type => type,
            :creator => creator,
            :length => 0,
            :is_paused => true,
            :start_date => nil,
            :current_time => 0,
            :has_played => false
        }
    end
end