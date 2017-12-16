FROM elixir:latest

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update
RUN apt-get install -y nodejs yarn inotify-tools

RUN mix local.hex --force

RUN mix local.rebar --force

RUN mix archive.install --force https://github.com/phoenixframework/archives/raw/master/phoenix_new.ez

RUN mkdir /app
COPY . /app
WORKDIR /app

RUN mix deps.get

RUN cd /app/assets && yarn install

RUN cd /app

RUN ls /app/assets/node_modules/webpack-dev-server/bin

CMD mix phx.server
